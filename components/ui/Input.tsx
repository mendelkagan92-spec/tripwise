"use client";

import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = "", ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm text-text-secondary mb-1.5">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors ${
            error ? "border-error focus:ring-error/50" : ""
          } ${className}`}
          {...props}
        />
        {error && <p className="mt-1 text-xs text-error">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
export default Input;
