import Badge from "./ui/Badge";

interface ReservationCardProps {
  reservation: {
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
  };
}

const TYPE_BADGE: Record<string, "flight" | "hotel" | "restaurant" | "attraction" | "default"> = {
  Flight: "flight",
  Hotel: "hotel",
  Restaurant: "restaurant",
  Attraction: "attraction",
};

export default function ReservationCard({ reservation }: ReservationCardProps) {
  const { event } = reservation;
  const badgeVariant = TYPE_BADGE[event.type] || "default";

  return (
    <div className="bg-surface border border-border rounded-xl p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm truncate">{event.name}</h3>
          <div className="flex items-center gap-2 mt-1.5">
            <Badge variant={badgeVariant}>{event.type}</Badge>
            <Badge variant={reservation.status === "Confirmed" ? "success" : "warning"}>
              {reservation.status}
            </Badge>
          </div>
          <div className="mt-2 space-y-0.5 text-xs text-text-secondary">
            <p>
              {new Date(event.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              {event.time ? ` at ${event.time}` : ""}
            </p>
            {event.location && <p>📍 {event.location}</p>}
          </div>
        </div>
        {event.confirmationNumber && (
          <div className="text-right shrink-0">
            <p className="text-xs text-text-secondary">Conf #</p>
            <p className="text-sm font-mono font-medium">{event.confirmationNumber}</p>
          </div>
        )}
      </div>
    </div>
  );
}
