"use client";

import Badge from "./ui/Badge";

const TYPE_CONFIG: Record<string, { emoji: string; variant: "flight" | "hotel" | "restaurant" | "attraction" | "transport" | "default" }> = {
  Flight: { emoji: "✈️", variant: "flight" },
  Hotel: { emoji: "🏨", variant: "hotel" },
  Restaurant: { emoji: "🍽️", variant: "restaurant" },
  Attraction: { emoji: "🎯", variant: "attraction" },
  Transport: { emoji: "🚕", variant: "transport" },
  Other: { emoji: "📌", variant: "default" },
};

interface Event {
  id: string;
  name: string;
  type: string;
  date: string;
  time: string | null;
  duration: string | null;
  location: string | null;
  confirmationNumber: string | null;
  notes: string | null;
}

export default function EventCard({
  event,
  onEdit,
  onDelete,
}: {
  event: Event;
  onEdit: (event: Event) => void;
  onDelete: (id: string) => void;
}) {
  const config = TYPE_CONFIG[event.type] || TYPE_CONFIG.Other;

  return (
    <div className="flex gap-3 group">
      {/* Time column */}
      <div className="w-14 text-right shrink-0 pt-1">
        <span className="text-sm font-medium text-text-secondary">
          {event.time || "—"}
        </span>
      </div>

      {/* Timeline dot & line */}
      <div className="flex flex-col items-center">
        <div className="w-3 h-3 rounded-full bg-accent mt-1.5 shrink-0" />
        <div className="w-px flex-1 bg-border" />
      </div>

      {/* Content */}
      <div className="flex-1 pb-6 min-w-0">
        <div className="bg-surface border border-border rounded-xl p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant={config.variant}>
                  {config.emoji} {event.type}
                </Badge>
                {event.duration && (
                  <span className="text-xs text-text-secondary">{event.duration}</span>
                )}
              </div>
              <h3 className="font-semibold text-sm truncate">{event.name}</h3>
              {event.location && (
                <p className="text-xs text-text-secondary mt-0.5 truncate">
                  📍 {event.location}
                </p>
              )}
              {event.confirmationNumber && (
                <p className="text-xs text-text-secondary mt-0.5">
                  Conf: {event.confirmationNumber}
                </p>
              )}
              {event.notes && (
                <p className="text-xs text-text-secondary mt-1 line-clamp-2">
                  {event.notes}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
              <button
                onClick={() => onEdit(event)}
                className="p-1 rounded hover:bg-white/5 text-text-secondary hover:text-text-primary"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
                  <path d="m3.433 11.917 1.262-3.155A4 4 0 0 1 5.58 7.42l4.92-4.918a2.121 2.121 0 0 1 3 3l-4.92 4.918a4 4 0 0 1-1.343.886l-3.154 1.262a.5.5 0 0 1-.65-.65Z" />
                </svg>
              </button>
              <button
                onClick={() => onDelete(event.id)}
                className="p-1 rounded hover:bg-error/10 text-text-secondary hover:text-error"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
                  <path fillRule="evenodd" d="M5 3.25V4H2.75a.75.75 0 0 0 0 1.5h.3l.815 8.15A1.5 1.5 0 0 0 5.357 15h5.285a1.5 1.5 0 0 0 1.493-1.35l.815-8.15h.3a.75.75 0 0 0 0-1.5H11v-.75A2.25 2.25 0 0 0 8.75 1h-1.5A2.25 2.25 0 0 0 5 3.25Zm2.25-.75a.75.75 0 0 0-.75.75V4h3v-.75a.75.75 0 0 0-.75-.75h-1.5ZM6.05 6a.75.75 0 0 1 .787.713l.275 5.5a.75.75 0 0 1-1.498.075l-.275-5.5A.75.75 0 0 1 6.05 6Zm3.9 0a.75.75 0 0 1 .712.787l-.275 5.5a.75.75 0 0 1-1.498-.075l.275-5.5A.75.75 0 0 1 9.95 6Z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
