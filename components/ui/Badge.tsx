import { ReactNode } from "react";

type BadgeVariant = "default" | "flight" | "hotel" | "restaurant" | "attraction" | "transport" | "success" | "warning" | "error";

const variantClasses: Record<BadgeVariant, string> = {
  default: "bg-white/10 text-text-primary",
  flight: "bg-badge-flight/20 text-badge-flight",
  hotel: "bg-badge-hotel/20 text-badge-hotel",
  restaurant: "bg-badge-restaurant/20 text-badge-restaurant",
  attraction: "bg-badge-attraction/20 text-badge-attraction",
  transport: "bg-badge-transport/20 text-badge-transport",
  success: "bg-success/20 text-success",
  warning: "bg-warning/20 text-warning",
  error: "bg-error/20 text-error",
};

interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
  className?: string;
}

export default function Badge({ variant = "default", children, className = "" }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  );
}
