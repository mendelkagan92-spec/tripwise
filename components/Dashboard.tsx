"use client";

import { useState, useEffect, useCallback } from "react";
import { signOut } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import TripCard from "./TripCard";
import TripForm from "./TripForm";
import Modal from "./ui/Modal";
import Button from "./ui/Button";

interface User {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

interface Trip {
  id: string;
  name: string;
  destination: string;
  emoji: string;
  startDate: string;
  endDate: string;
}

export default function Dashboard({ user }: { user: User }) {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editTrip, setEditTrip] = useState<Trip | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchTrips = useCallback(async () => {
    const res = await fetch("/api/trips");
    if (res.ok) {
      const data = await res.json();
      setTrips(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchTrips();
  }, [fetchTrips]);

  const handleCreate = async (data: { name: string; destination: string; emoji: string; startDate: string; endDate: string }) => {
    const res = await fetch("/api/trips", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      setShowCreate(false);
      fetchTrips();
    }
  };

  const handleEdit = async (data: { name: string; destination: string; emoji: string; startDate: string; endDate: string }) => {
    if (!editTrip) return;
    const res = await fetch(`/api/trips/${editTrip.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      setEditTrip(null);
      fetchTrips();
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const res = await fetch(`/api/trips/${deleteId}`, { method: "DELETE" });
    if (res.ok) {
      setDeleteId(null);
      fetchTrips();
    }
  };

  const upcomingTrips = trips.filter((t) => new Date(t.startDate) > new Date());
  const pastTrips = trips.filter((t) => new Date(t.endDate) < new Date());
  const activeTrips = trips.filter(
    (t) => new Date(t.startDate) <= new Date() && new Date(t.endDate) >= new Date()
  );

  return (
    <main className="min-h-screen px-4 py-8 max-w-lg mx-auto pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading text-3xl font-bold">Tripwise</h1>
          <p className="text-text-secondary text-sm">
            Welcome, {user.name?.split(" ")[0] || "traveler"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {user.image && (
            <Image
              src={user.image}
              alt=""
              width={36}
              height={36}
              className="rounded-full border border-border"
            />
          )}
          <button
            onClick={() => signOut()}
            className="text-xs text-text-secondary hover:text-text-primary transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 mb-6">
        <Button onClick={() => setShowCreate(true)} className="flex-1">
          + New Trip
        </Button>
        <Link href="/community">
          <Button variant="secondary">🌍 Community</Button>
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-16 text-text-secondary">Loading...</div>
      ) : trips.length === 0 ? (
        <div className="text-center py-16 text-text-secondary">
          <p className="text-5xl mb-4">🗺️</p>
          <p className="mb-2">No trips yet</p>
          <p className="text-sm">Create your first trip to get started!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {activeTrips.length > 0 && (
            <section>
              <h2 className="text-sm font-medium text-text-secondary uppercase tracking-wider mb-3">Active Now</h2>
              <div className="space-y-3">
                {activeTrips.map((trip) => (
                  <TripCard
                    key={trip.id}
                    trip={trip}
                    onEdit={setEditTrip}
                    onDelete={setDeleteId}
                  />
                ))}
              </div>
            </section>
          )}

          {upcomingTrips.length > 0 && (
            <section>
              <h2 className="text-sm font-medium text-text-secondary uppercase tracking-wider mb-3">Upcoming</h2>
              <div className="space-y-3">
                {upcomingTrips.map((trip) => (
                  <TripCard
                    key={trip.id}
                    trip={trip}
                    onEdit={setEditTrip}
                    onDelete={setDeleteId}
                  />
                ))}
              </div>
            </section>
          )}

          {pastTrips.length > 0 && (
            <section>
              <h2 className="text-sm font-medium text-text-secondary uppercase tracking-wider mb-3">Past Trips</h2>
              <div className="space-y-3">
                {pastTrips.map((trip) => (
                  <TripCard
                    key={trip.id}
                    trip={trip}
                    onEdit={setEditTrip}
                    onDelete={setDeleteId}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* Create Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New Trip">
        <TripForm
          onSubmit={handleCreate}
          onCancel={() => setShowCreate(false)}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal open={!!editTrip} onClose={() => setEditTrip(null)} title="Edit Trip">
        {editTrip && (
          <TripForm
            initialData={{
              name: editTrip.name,
              destination: editTrip.destination,
              emoji: editTrip.emoji,
              startDate: editTrip.startDate.split("T")[0],
              endDate: editTrip.endDate.split("T")[0],
            }}
            onSubmit={handleEdit}
            onCancel={() => setEditTrip(null)}
            submitLabel="Save Changes"
          />
        )}
      </Modal>

      {/* Delete Confirmation */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Trip">
        <p className="text-text-secondary mb-6">
          Are you sure? This will permanently delete this trip and all its events, reservations, and emails.
        </p>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => setDeleteId(null)} className="flex-1">
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete} className="flex-1">
            Delete
          </Button>
        </div>
      </Modal>
    </main>
  );
}
