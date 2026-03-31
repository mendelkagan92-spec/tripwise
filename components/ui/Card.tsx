import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export default function Card({ children, className = "", onClick }: CardProps) {
  return (
    <div
      className={`bg-surface border border-border rounded-xl p-4 ${onClick ? "cursor-pointer hover:border-accent/30 transition-colors" : ""} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
