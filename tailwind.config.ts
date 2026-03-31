import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0a0a0f",
        surface: "#141419",
        border: "#1e1e26",
        "text-primary": "#f5f5f7",
        "text-secondary": "#8a8a9a",
        accent: "#6366f1",
        success: "#22c55e",
        warning: "#f59e0b",
        error: "#ef4444",
        "badge-flight": "#3b82f6",
        "badge-hotel": "#a855f7",
        "badge-restaurant": "#f97316",
        "badge-attraction": "#22c55e",
        "badge-transport": "#6b7280",
      },
      fontFamily: {
        sans: ["var(--font-dm-sans)", "system-ui", "sans-serif"],
        heading: ["var(--font-fraunces)", "serif"],
      },
    },
  },
  plugins: [],
};
export default config;
