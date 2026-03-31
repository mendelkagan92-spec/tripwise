"use client";

import { useState } from "react";
import Button from "./ui/Button";
import Input from "./ui/Input";

const EMOJIS = ["✈️", "🏖️", "🏔️", "🗼", "🏰", "🌴", "🚗", "🚢", "🎿", "🌆", "🗺️", "🎭"];

interface TripFormData {
  name: string;
  destination: string;
  emoji: string;
  startDate: string;
  endDate: string;
}

interface TripFormProps {
  initialData?: TripFormData;
  onSubmit: (data: TripFormData) => Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
}

export default function TripForm({ initialData, onSubmit, onCancel, submitLabel = "Create Trip" }: TripFormProps) {
  const [form, setForm] = useState<TripFormData>({
    name: initialData?.name || "",
    destination: initialData?.destination || "",
    emoji: initialData?.emoji || "✈️",
    startDate: initialData?.startDate || "",
    endDate: initialData?.endDate || "",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(form);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Trip Name"
        placeholder="Summer in Paris"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        required
      />
      <Input
        label="Destination"
        placeholder="Paris, France"
        value={form.destination}
        onChange={(e) => setForm({ ...form, destination: e.target.value })}
        required
      />
      <div>
        <label className="block text-sm text-text-secondary mb-1.5">Cover Emoji</label>
        <div className="flex flex-wrap gap-2">
          {EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => setForm({ ...form, emoji })}
              className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center transition-colors ${
                form.emoji === emoji ? "bg-accent/20 ring-2 ring-accent" : "bg-background hover:bg-white/5"
              }`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Start Date"
          type="date"
          value={form.startDate}
          onChange={(e) => setForm({ ...form, startDate: e.target.value })}
          required
        />
        <Input
          label="End Date"
          type="date"
          value={form.endDate}
          onChange={(e) => setForm({ ...form, endDate: e.target.value })}
          required
        />
      </div>
      <div className="flex gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button type="submit" disabled={loading} className="flex-1">
          {loading ? "Saving..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
