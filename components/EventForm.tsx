"use client";

import { useState } from "react";
import Button from "./ui/Button";
import Input from "./ui/Input";

const EVENT_TYPES = [
  { value: "Flight", label: "Flight", emoji: "✈️" },
  { value: "Hotel", label: "Hotel", emoji: "🏨" },
  { value: "Restaurant", label: "Restaurant", emoji: "🍽️" },
  { value: "Attraction", label: "Attraction", emoji: "🎯" },
  { value: "Transport", label: "Transport", emoji: "🚕" },
  { value: "Other", label: "Other", emoji: "📌" },
];

export interface EventFormData {
  name: string;
  type: string;
  date: string;
  time: string;
  duration: string;
  location: string;
  confirmationNumber: string;
  notes: string;
}

interface EventFormProps {
  initialData?: Partial<EventFormData>;
  onSubmit: (data: EventFormData) => Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
}

export default function EventForm({ initialData, onSubmit, onCancel, submitLabel = "Add Event" }: EventFormProps) {
  const [form, setForm] = useState<EventFormData>({
    name: initialData?.name || "",
    type: initialData?.type || "Other",
    date: initialData?.date || "",
    time: initialData?.time || "",
    duration: initialData?.duration || "",
    location: initialData?.location || "",
    confirmationNumber: initialData?.confirmationNumber || "",
    notes: initialData?.notes || "",
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
        label="Event Name"
        placeholder="Flight to Paris"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        required
      />

      <div>
        <label className="block text-sm text-text-secondary mb-1.5">Type</label>
        <div className="grid grid-cols-3 gap-2">
          {EVENT_TYPES.map((type) => (
            <button
              key={type.value}
              type="button"
              onClick={() => setForm({ ...form, type: type.value })}
              className={`px-3 py-2 rounded-lg text-sm flex items-center gap-1.5 transition-colors ${
                form.type === type.value
                  ? "bg-accent/20 ring-2 ring-accent text-text-primary"
                  : "bg-background border border-border text-text-secondary hover:text-text-primary"
              }`}
            >
              <span>{type.emoji}</span>
              <span>{type.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Date"
          type="date"
          value={form.date}
          onChange={(e) => setForm({ ...form, date: e.target.value })}
          required
        />
        <Input
          label="Time"
          type="time"
          value={form.time}
          onChange={(e) => setForm({ ...form, time: e.target.value })}
        />
      </div>

      <Input
        label="Duration"
        placeholder="2h, 1h30m, etc."
        value={form.duration}
        onChange={(e) => setForm({ ...form, duration: e.target.value })}
      />

      <Input
        label="Location"
        placeholder="CDG Airport, Terminal 2E"
        value={form.location}
        onChange={(e) => setForm({ ...form, location: e.target.value })}
      />

      <Input
        label="Confirmation Number"
        placeholder="ABC123"
        value={form.confirmationNumber}
        onChange={(e) => setForm({ ...form, confirmationNumber: e.target.value })}
      />

      <div>
        <label className="block text-sm text-text-secondary mb-1.5">Notes</label>
        <textarea
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          placeholder="Any additional details..."
          rows={3}
          className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors resize-none"
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
