"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import ReservationCard from "@/components/ReservationCard";

interface Reservation {
  id: string;
  status: string;
  event: {
    name: string;
    type: string;
    date: string;
    time: string | null;
    location: string | null;
    confirmationNumber: string | null;
  };
}

const CATEGORIES = [
  { key: "Flight", label: "Flights", emoji: "✈️" },
  { key: "Hotel", label: "Hotels", emoji: "🏨" },
  { key: "Restaurant", label: "Restaurants", emoji: "🍽️" },
  { key: "Attraction", label: "Activities", emoji: "🎯" },
];

export default function ReservationsPage() {
  const params = useParams();
  const tripId = params.id as string;

  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  const fetchReservations = useCallback(async () => {
    const res = await fetch(`/api/reservations?tripId=${tripId}`);
    if (res.ok) {
      setReservations(await res.json());
    }
    setLoading(false);
  }, [tripId]);

  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);

  const filtered = activeTab === "all"
    ? reservations
    : reservations.filter((r) => r.event.type === activeTab);

  return (
    <main className="px-4 py-6 max-w-lg mx-auto">
      <h1 className="font-heading text-2xl font-bold mb-4">Bookings</h1>

      {/* Category tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab("all")}
          className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${
            activeTab === "all"
              ? "bg-accent text-white"
              : "bg-surface border border-border text-text-secondary hover:text-text-primary"
          }`}
        >
          All ({reservations.length})
        </button>
        {CATEGORIES.map((cat) => {
          const count = reservations.filter((r) => r.event.type === cat.key).length;
          return (
            <button
              key={cat.key}
              onClick={() => setActiveTab(cat.key)}
              className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${
                activeTab === cat.key
                  ? "bg-accent text-white"
                  : "bg-surface border border-border text-text-secondary hover:text-text-primary"
              }`}
            >
              {cat.emoji} {cat.label} ({count})
            </button>
          );
        })}
      </div>

      {loading ? (
        <p className="text-text-secondary text-center py-12">Loading...</p>
      ) : reservations.length === 0 ? (
        <div className="text-center py-16 text-text-secondary">
          <p className="text-4xl mb-3">🎫</p>
          <p className="mb-2">No bookings yet</p>
          <p className="text-sm">Forward confirmation emails to your trip inbox, or they&apos;ll appear here when you add events with confirmation numbers.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-text-secondary">
          <p className="text-sm">No bookings in this category.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((reservation) => (
            <ReservationCard key={reservation.id} reservation={reservation} />
          ))}
        </div>
      )}
    </main>
  );
}
