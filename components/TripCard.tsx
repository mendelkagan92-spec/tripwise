"use client";

import { useRouter } from "next/navigation";
import Card from "./ui/Card";
import Badge from "./ui/Badge";

interface Trip {
  id: string;
  name: string;
  destination: string;
  emoji: string;
  startDate: string;
  endDate: string;
}

function getCountdown(startDate: string): string {
  const now = new Date();
  const start = new Date(startDate);
  const diffMs = start.getTime() - now.getTime();

  if (diffMs < 0) return "In progress or past";

  const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (days === 0) return "Today!";
  if (days === 1) return "Tomorrow!";
  return `${days} days away`;
}

function getStatus(startDate: string, endDate: string): "upcoming" | "active" | "past" {
  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (now < start) return "upcoming";
  if (now >= start && now <= end) return "active";
  return "past";
}

function formatDateRange(startDate: string, endDate: string): string {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  return `${start.toLocaleDateString("en-US", opts)} - ${end.toLocaleDateString("en-US", opts)}`;
}

export default function TripCard({
  trip,
  onEdit,
  onDelete,
}: {
  trip: Trip;
  onEdit: (trip: Trip) => void;
  onDelete: (id: string) => void;
}) {
  const router = useRouter();
  const status = getStatus(trip.startDate, trip.endDate);
  const countdown = getCountdown(trip.startDate);

  return (
    <Card
      className="relative"
      onClick={() => router.push(`/trips/${trip.id}/itinerary`)}
    >
      <div className="flex items-start gap-3">
        <span className="text-3xl">{trip.emoji}</span>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-lg truncate">{trip.name}</h3>
          <p className="text-text-secondary text-sm">{trip.destination}</p>
          <p className="text-text-secondary text-xs mt-1">
            {formatDateRange(trip.startDate, trip.endDate)}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Badge
            variant={status === "upcoming" ? "default" : status === "active" ? "success" : "default"}
          >
            {status === "active" ? "Active" : status === "upcoming" ? "Upcoming" : "Past"}
          </Badge>
          {status === "upcoming" && (
            <span className="text-xs text-accent font-medium">{countdown}</span>
          )}
        </div>
      </div>

      <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit(trip);
          }}
          className="p-1.5 rounded-lg hover:bg-white/5 text-text-secondary hover:text-text-primary transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path d="m5.433 13.917 1.262-3.155A4 4 0 0 1 7.58 9.42l6.92-6.918a2.121 2.121 0 0 1 3 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 0 1-.65-.65Z" />
          </svg>
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(trip.id);
          }}
          className="p-1.5 rounded-lg hover:bg-error/10 text-text-secondary hover:text-error transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.519.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </Card>
  );
}
