import Badge from "./ui/Badge";

const FLAG_LABELS: Record<string, string> = {
  tourist_trap: "Tourist Trap",
  overpriced: "Overpriced",
  skip_it: "Skip It",
  hidden_gem: "Hidden Gem",
};

const FLAG_VARIANTS: Record<string, "warning" | "error" | "success"> = {
  tourist_trap: "warning",
  overpriced: "warning",
  skip_it: "error",
  hidden_gem: "success",
};

export default function PlaceFlagBadge({ type, count }: { type: string; count?: number }) {
  const label = FLAG_LABELS[type] || type;
  const variant = FLAG_VARIANTS[type] || "warning";

  return (
    <Badge variant={variant}>
      {variant === "success" ? "💎" : "⚠️"} {count ? `${count} ` : ""}{label}
    </Badge>
  );
}
