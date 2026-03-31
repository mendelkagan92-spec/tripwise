"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import MapView from "@/components/MapView";
import Button from "@/components/ui/Button";

interface MapEvent {
  id: string;
  name: string;
  type: string;
  date: string;
  time: string | null;
  location: string | null;
  lat: number | null;
  lng: number | null;
}

export default function MapPage() {
  const params = useParams();
  const tripId = params.id as string;

  const [events, setEvents] = useState<MapEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [geocoding, setGeocoding] = useState(false);

  const fetchEvents = useCallback(async () => {
    const res = await fetch(`/api/events?tripId=${tripId}`);
    if (res.ok) {
      setEvents(await res.json());
    }
    setLoading(false);
  }, [tripId]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const geocodeAll = async () => {
    setGeocoding(true);
    const needsGeocode = events.filter((e) => e.location && e.lat === null);

    for (const event of needsGeocode) {
      await fetch("/api/geocode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId: event.id, address: event.location }),
      });
    }

    await fetchEvents();
    setGeocoding(false);
  };

  const ungeocodedCount = events.filter((e) => e.location && e.lat === null).length;

  return (
    <main className="px-4 py-6 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-heading text-2xl font-bold">Map</h1>
        {ungeocodedCount > 0 && (
          <Button size="sm" variant="secondary" onClick={geocodeAll} disabled={geocoding}>
            {geocoding ? "Geocoding..." : `Geocode ${ungeocodedCount} locations`}
          </Button>
        )}
      </div>

      {loading ? (
        <p className="text-text-secondary text-center py-12">Loading...</p>
      ) : (
        <MapView events={events} />
      )}
    </main>
  );
}
