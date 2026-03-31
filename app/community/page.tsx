"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import PlaceFlagBadge from "@/components/PlaceFlagBadge";
import TipsList from "@/components/TipsList";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";

interface Place {
  id: string;
  name: string;
  city: string;
  flagCount: number;
  flags: { type: string; note: string | null; user: { name: string | null } }[];
  tips: {
    id: string;
    content: string;
    upvotes: number;
    user: { name: string | null };
    votes: { userId: string }[];
  }[];
}

const FLAG_TYPES = [
  { value: "tourist_trap", label: "Tourist Trap", emoji: "🪤" },
  { value: "overpriced", label: "Overpriced", emoji: "💸" },
  { value: "skip_it", label: "Skip It", emoji: "⛔" },
  { value: "hidden_gem", label: "Hidden Gem", emoji: "💎" },
];

export default function CommunityPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showFlagModal, setShowFlagModal] = useState<string | null>(null);
  const [flagType, setFlagType] = useState("tourist_trap");
  const [flagNote, setFlagNote] = useState("");

  const fetchPlaces = useCallback(async () => {
    const url = search ? `/api/places?city=${encodeURIComponent(search)}` : "/api/places";
    const res = await fetch(url);
    if (res.ok) {
      setPlaces(await res.json());
    }
    setLoading(false);
  }, [search]);

  useEffect(() => {
    const timeout = setTimeout(fetchPlaces, 300);
    return () => clearTimeout(timeout);
  }, [fetchPlaces]);

  if (!session) {
    router.push("/login");
    return null;
  }

  const handleFlag = async () => {
    if (!showFlagModal) return;
    await fetch(`/api/places/${showFlagModal}/flags`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: flagType, note: flagNote || null }),
    });
    setShowFlagModal(null);
    setFlagNote("");
    fetchPlaces();
  };

  const handleVote = async (placeId: string, tipId: string) => {
    await fetch(`/api/places/${placeId}/tips/${tipId}/vote`, { method: "POST" });
    fetchPlaces();
  };

  const handleAddTip = async (placeId: string, content: string) => {
    await fetch(`/api/places/${placeId}/tips`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    fetchPlaces();
  };

  // Group flag counts by type for each place
  const getFlagCounts = (flags: { type: string }[]) => {
    const counts: Record<string, number> = {};
    flags.forEach((f) => {
      counts[f.type] = (counts[f.type] || 0) + 1;
    });
    return counts;
  };

  return (
    <main className="min-h-screen px-4 py-8 max-w-lg mx-auto pb-24">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-3xl font-bold">Community</h1>
          <p className="text-text-secondary text-sm">Flags & tips from travelers</p>
        </div>
        <button onClick={() => router.push("/")} className="text-sm text-accent hover:underline">
          My Trips
        </button>
      </div>

      <Input
        placeholder="Search by city..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-6"
      />

      {loading ? (
        <p className="text-text-secondary text-center py-12">Loading...</p>
      ) : places.length === 0 ? (
        <div className="text-center py-16 text-text-secondary">
          <p className="text-4xl mb-3">🌍</p>
          <p className="mb-2">No flagged places yet</p>
          <p className="text-sm">Be the first to flag a place or leave a tip!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {places.map((place) => {
            const flagCounts = getFlagCounts(place.flags);
            const isExpanded = expandedId === place.id;

            return (
              <div key={place.id} className="bg-surface border border-border rounded-xl overflow-hidden">
                <button
                  onClick={() => setExpandedId(isExpanded ? null : place.id)}
                  className="w-full text-left p-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm">{place.name}</h3>
                      <p className="text-xs text-text-secondary">{place.city}</p>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {Object.entries(flagCounts).map(([type, count]) => (
                          <PlaceFlagBadge key={type} type={type} count={count} />
                        ))}
                      </div>
                    </div>
                    <span className="text-xs text-text-secondary">
                      {place.tips.length} tip{place.tips.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-border pt-3 space-y-4">
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setShowFlagModal(place.id)}
                      >
                        Flag this place
                      </Button>
                    </div>

                    {place.tips.length > 0 && (
                      <div>
                        <h4 className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-2">
                          Tips
                        </h4>
                        <TipsList
                          tips={place.tips}
                          placeId={place.id}
                          currentUserId={session.user.id}
                          onVote={handleVote}
                          onAddTip={handleAddTip}
                        />
                      </div>
                    )}

                    {place.tips.length === 0 && (
                      <TipsList
                        tips={[]}
                        placeId={place.id}
                        currentUserId={session.user.id}
                        onVote={handleVote}
                        onAddTip={handleAddTip}
                      />
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Flag Modal */}
      <Modal open={!!showFlagModal} onClose={() => setShowFlagModal(null)} title="Flag this place">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {FLAG_TYPES.map((ft) => (
              <button
                key={ft.value}
                onClick={() => setFlagType(ft.value)}
                className={`px-3 py-2 rounded-lg text-sm flex items-center gap-1.5 transition-colors ${
                  flagType === ft.value
                    ? "bg-accent/20 ring-2 ring-accent text-text-primary"
                    : "bg-background border border-border text-text-secondary"
                }`}
              >
                <span>{ft.emoji}</span>
                <span>{ft.label}</span>
              </button>
            ))}
          </div>
          <Input
            label="Note (optional)"
            placeholder="e.g. 'overpriced, go to the place next door instead'"
            value={flagNote}
            onChange={(e) => setFlagNote(e.target.value)}
          />
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setShowFlagModal(null)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleFlag} className="flex-1">
              Submit Flag
            </Button>
          </div>
        </div>
      </Modal>
    </main>
  );
}
