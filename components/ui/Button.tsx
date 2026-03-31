"use client";

import { ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const variants: Record<Variant, string> = {
  primary: "bg-accent hover:bg-accent/90 text-white",
  secondary: "bg-surface hover:bg-surface/80 text-text-primary border border-border",
  ghost: "hover:bg-surface text-text-secondary hover:text-text-primary",
  danger: "bg-error/10 hover:bg-error/20 text-error border border-error/20",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: "sm" | "md" | "lg";
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "primary", size = "md", children, ...props }, ref) => {
    const sizeClasses = {
      sm: "px-3 py-1.5 text-sm",
      md: "px-4 py-2 text-sm",
      lg: "px-6 py-3 text-base",
    };

    return (
      <button
        ref={ref}
        className={`inline-flex items-center justify-center rounded-lg font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none ${variants[variant]} ${sizeClasses[size]} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
export default Button;
