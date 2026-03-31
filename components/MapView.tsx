"use client";

import { useState, useCallback } from "react";
import { APIProvider, Map, AdvancedMarker, InfoWindow } from "@vis.gl/react-google-maps";
import Badge from "./ui/Badge";

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

const PIN_COLORS: Record<string, string> = {
  Flight: "#3b82f6",
  Hotel: "#a855f7",
  Restaurant: "#f97316",
  Attraction: "#22c55e",
  Transport: "#6b7280",
  Other: "#f5f5f7",
};

const TYPE_BADGE: Record<string, "flight" | "hotel" | "restaurant" | "attraction" | "transport" | "default"> = {
  Flight: "flight",
  Hotel: "hotel",
  Restaurant: "restaurant",
  Attraction: "attraction",
  Transport: "transport",
  Other: "default",
};

export default function MapView({ events }: { events: MapEvent[] }) {
  const [selected, setSelected] = useState<MapEvent | null>(null);
  const [filter, setFilter] = useState("");

  const eventsWithCoords = events.filter((e) => e.lat !== null && e.lng !== null);

  const filtered = filter
    ? eventsWithCoords.filter(
        (e) =>
          e.name.toLowerCase().includes(filter.toLowerCase()) ||
          e.type.toLowerCase().includes(filter.toLowerCase()) ||
          e.location?.toLowerCase().includes(filter.toLowerCase())
      )
    : eventsWithCoords;

  const center = filtered.length > 0
    ? {
        lat: filtered.reduce((sum, e) => sum + (e.lat || 0), 0) / filtered.length,
        lng: filtered.reduce((sum, e) => sum + (e.lng || 0), 0) / filtered.length,
      }
    : { lat: 48.8566, lng: 2.3522 }; // Default to Paris

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  const handleMarkerClick = useCallback((event: MapEvent) => {
    setSelected(event);
  }, []);

  if (!apiKey) {
    return (
      <div className="flex items-center justify-center h-[60vh] text-text-secondary">
        <p>Google Maps API key not configured.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Search/filter */}
      <input
        type="text"
        placeholder="Filter by name, type, or location..."
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-accent/50"
      />

      {/* Map */}
      <div className="rounded-xl overflow-hidden border border-border" style={{ height: "60vh" }}>
        <APIProvider apiKey={apiKey}>
          <Map
            defaultCenter={center}
            defaultZoom={12}
            mapId="tripwise-map"
            gestureHandling="greedy"
            disableDefaultUI={false}
            style={{ width: "100%", height: "100%" }}
          >
            {filtered.map((event) => (
              <AdvancedMarker
                key={event.id}
                position={{ lat: event.lat!, lng: event.lng! }}
                onClick={() => handleMarkerClick(event)}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg border-2 border-white"
                  style={{ backgroundColor: PIN_COLORS[event.type] || PIN_COLORS.Other }}
                >
                  {event.type[0]}
                </div>
              </AdvancedMarker>
            ))}

            {selected && selected.lat && selected.lng && (
              <InfoWindow
                position={{ lat: selected.lat, lng: selected.lng }}
                onCloseClick={() => setSelected(null)}
              >
                <div className="p-1 max-w-[200px]">
                  <Badge variant={TYPE_BADGE[selected.type] || "default"}>
                    {selected.type}
                  </Badge>
                  <p className="font-semibold text-sm mt-1 text-gray-900">{selected.name}</p>
                  {selected.location && (
                    <p className="text-xs text-gray-600 mt-0.5">{selected.location}</p>
                  )}
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${selected.lat},${selected.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline mt-1 block"
                  >
                    Open in Google Maps
                  </a>
                </div>
              </InfoWindow>
            )}
          </Map>
        </APIProvider>
      </div>

      {/* Event list with map links */}
      <div className="space-y-2">
        {filtered.map((event) => (
          <div
            key={event.id}
            className="bg-surface border border-border rounded-lg p-3 flex items-center justify-between"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: PIN_COLORS[event.type] || PIN_COLORS.Other }}
                />
                <span className="text-sm font-medium truncate">{event.name}</span>
              </div>
              {event.location && (
                <p className="text-xs text-text-secondary ml-5 truncate">{event.location}</p>
              )}
            </div>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${event.lat},${event.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-accent hover:underline shrink-0 ml-2"
            >
              Open
            </a>
          </div>
        ))}
      </div>

      {eventsWithCoords.length === 0 && (
        <div className="text-center py-8 text-text-secondary">
          <p className="text-4xl mb-3">📍</p>
          <p className="text-sm">No geocoded events yet. Add locations to your events to see them on the map.</p>
        </div>
      )}
    </div>
  );
}
