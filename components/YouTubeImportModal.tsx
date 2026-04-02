"use client";

import { useState } from "react";
import Modal from "./ui/Modal";
import Button from "./ui/Button";
import Input from "./ui/Input";
import Badge from "./ui/Badge";

interface YouTubeImportModalProps {
  open: boolean;
  onClose: () => void;
  tripId: string;
  onImported: () => void;
}

interface ItineraryItem {
  name: string;
  type: string;
  suggested_day: number;
  suggested_time: string | null;
  location: string | null;
  duration: string | null;
  notes: string | null;
  selected: boolean;
}

type Step = "input" | "loading" | "preview" | "importing" | "done";

const TYPE_BADGE: Record<string, "flight" | "hotel" | "restaurant" | "attraction" | "transport" | "default"> = {
  Flight: "flight",
  Hotel: "hotel",
  Restaurant: "restaurant",
  Attraction: "attraction",
  Transport: "transport",
};

export default function YouTubeImportModal({ open, onClose, tripId, onImported }: YouTubeImportModalProps) {
  const [step, setStep] = useState<Step>("input");
  const [url, setUrl] = useState("");
  const [items, setItems] = useState<ItineraryItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [importedCount, setImportedCount] = useState(0);

  const reset = () => {
    setStep("input");
    setUrl("");
    setItems([]);
    setError(null);
    setImportedCount(0);
  };

  const handleGenerate = async () => {
    if (!url.trim()) return;
    setError(null);
    setStep("loading");

    try {
      const res = await fetch("/api/events/youtube", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong");
        setStep("input");
        return;
      }

      setItems(
        data.items.map((item: Omit<ItineraryItem, "selected">) => ({
          ...item,
          selected: true,
        }))
      );
      setStep("preview");
    } catch {
      setError("Failed to connect. Please try again.");
      setStep("input");
    }
  };

  const toggleItem = (index: number) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, selected: !item.selected } : item))
    );
  };

  const toggleAll = () => {
    const allSelected = items.every((i) => i.selected);
    setItems((prev) => prev.map((item) => ({ ...item, selected: !allSelected })));
  };

  const handleImport = async () => {
    setStep("importing");

    const selectedItems = items.filter((i) => i.selected);
    const today = new Date();

    const rows = selectedItems.map((item) => {
      const eventDate = new Date(today);
      eventDate.setDate(eventDate.getDate() + (item.suggested_day - 1));

      return {
        name: item.name,
        type: item.type || "Other",
        date: eventDate.toISOString().split("T")[0],
        time: item.suggested_time || "",
        duration: item.duration || "",
        location: item.location || "",
        confirmationNumber: "",
        notes: item.notes || "",
      };
    });

    const res = await fetch("/api/events/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tripId, rows }),
    });

    if (res.ok) {
      const data = await res.json();
      setImportedCount(data.count);
      setStep("done");
      onImported();
    } else {
      setError("Failed to import events.");
      setStep("preview");
    }
  };

  const selectedCount = items.filter((i) => i.selected).length;

  // Group items by day for preview
  const byDay: Record<number, ItineraryItem[]> = {};
  items.forEach((item, idx) => {
    const day = item.suggested_day || 1;
    if (!byDay[day]) byDay[day] = [];
    byDay[day].push({ ...item, selected: items[idx].selected });
  });

  return (
    <Modal
      open={open}
      onClose={() => { reset(); onClose(); }}
      title={
        step === "input" ? "Import from YouTube" :
        step === "loading" ? "Watching video..." :
        step === "preview" ? "Review Itinerary" :
        step === "importing" ? "Importing..." :
        "Import Complete"
      }
    >
      {step === "input" && (
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">
            Paste a travel YouTube video URL and we&apos;ll use AI to extract an itinerary from the video transcript.
          </p>
          <Input
            label="YouTube URL"
            placeholder="https://www.youtube.com/watch?v=..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          {error && (
            <div className="bg-error/10 border border-error/20 rounded-lg p-3 text-sm text-error">
              {error}
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={() => { reset(); onClose(); }} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleGenerate} disabled={!url.trim()} className="flex-1">
              Generate Itinerary
            </Button>
          </div>
        </div>
      )}

      {step === "loading" && (
        <div className="py-12 text-center">
          <div className="inline-block w-10 h-10 border-4 border-accent/30 border-t-accent rounded-full animate-spin mb-4" />
          <p className="text-text-primary font-medium">Watching video...</p>
          <p className="text-text-secondary text-sm mt-1">
            Extracting transcript and building your itinerary with AI
          </p>
        </div>
      )}

      {step === "preview" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-text-secondary">
              {items.length} items found — {selectedCount} selected
            </p>
            <button onClick={toggleAll} className="text-xs text-accent hover:underline">
              {items.every((i) => i.selected) ? "Deselect all" : "Select all"}
            </button>
          </div>

          <div className="max-h-[50vh] overflow-y-auto space-y-4">
            {Object.entries(byDay)
              .sort(([a], [b]) => Number(a) - Number(b))
              .map(([day, dayItems]) => (
                <div key={day}>
                  <h3 className="text-xs font-medium text-accent uppercase tracking-wider mb-2 sticky top-0 bg-surface py-1">
                    Day {day}
                  </h3>
                  <div className="space-y-2">
                    {dayItems.map((item) => {
                      const globalIdx = items.findIndex(
                        (i) => i.name === item.name && i.suggested_day === item.suggested_day
                      );
                      return (
                        <label
                          key={globalIdx}
                          className={`flex items-start gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                            items[globalIdx]?.selected
                              ? "bg-background border-accent/30"
                              : "bg-background/50 border-border opacity-50"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={items[globalIdx]?.selected ?? false}
                            onChange={() => toggleItem(globalIdx)}
                            className="mt-1 shrink-0 accent-accent"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-sm font-medium">{item.name}</span>
                              <Badge variant={TYPE_BADGE[item.type] || "default"}>
                                {item.type}
                              </Badge>
                            </div>
                            <div className="text-xs text-text-secondary space-y-0.5">
                              {item.suggested_time && <p>Time: {item.suggested_time}</p>}
                              {item.location && <p>📍 {item.location}</p>}
                              {item.duration && <p>Duration: {item.duration}</p>}
                              {item.notes && <p className="italic">{item.notes}</p>}
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
          </div>

          {error && (
            <div className="bg-error/10 border border-error/20 rounded-lg p-3 text-sm text-error">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={() => setStep("input")} className="flex-1">
              Back
            </Button>
            <Button onClick={handleImport} disabled={selectedCount === 0} className="flex-1">
              Import {selectedCount} items
            </Button>
          </div>
        </div>
      )}

      {step === "importing" && (
        <div className="py-12 text-center">
          <div className="inline-block w-10 h-10 border-4 border-accent/30 border-t-accent rounded-full animate-spin mb-4" />
          <p className="text-text-primary font-medium">Importing events...</p>
        </div>
      )}

      {step === "done" && (
        <div className="text-center py-6">
          <p className="text-4xl mb-3">✅</p>
          <p className="text-lg font-semibold mb-2">
            {importedCount} events imported!
          </p>
          <p className="text-sm text-text-secondary mb-4">
            Check your itinerary to see the new events.
          </p>
          <Button onClick={() => { reset(); onClose(); }}>
            Done
          </Button>
        </div>
      )}
    </Modal>
  );
}
