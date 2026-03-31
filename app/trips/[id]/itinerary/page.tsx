"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import EventCard from "@/components/EventCard";
import EventForm, { EventFormData } from "@/components/EventForm";
import ImportModal from "@/components/ImportModal";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";

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

function groupByDate(events: Event[]): Record<string, Event[]> {
  const groups: Record<string, Event[]> = {};
  for (const event of events) {
    const dateKey = new Date(event.date).toISOString().split("T")[0];
    if (!groups[dateKey]) groups[dateKey] = [];
    groups[dateKey].push(event);
  }
  return groups;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T12:00:00");
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export default function ItineraryPage() {
  const params = useParams();
  const tripId = params.id as string;

  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editEvent, setEditEvent] = useState<Event | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showImport, setShowImport] = useState(false);

  const fetchEvents = useCallback(async () => {
    const res = await fetch(`/api/events?tripId=${tripId}`);
    if (res.ok) {
      setEvents(await res.json());
    }
    setLoading(false);
  }, [tripId]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleAdd = async (data: EventFormData) => {
    const res = await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, tripId }),
    });
    if (res.ok) {
      setShowAdd(false);
      fetchEvents();
    }
  };

  const handleEdit = async (data: EventFormData) => {
    if (!editEvent) return;
    const res = await fetch(`/api/events/${editEvent.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      setEditEvent(null);
      fetchEvents();
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const res = await fetch(`/api/events/${deleteId}`, { method: "DELETE" });
    if (res.ok) {
      setDeleteId(null);
      fetchEvents();
    }
  };

  const grouped = groupByDate(events);
  const sortedDates = Object.keys(grouped).sort();

  return (
    <main className="px-4 py-6 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading text-2xl font-bold">Itinerary</h1>
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={() => setShowImport(true)}>
            Import
          </Button>
          <Button size="sm" onClick={() => setShowAdd(true)}>
            + Add
          </Button>
        </div>
      </div>

      {loading ? (
        <p className="text-text-secondary text-center py-12">Loading...</p>
      ) : events.length === 0 ? (
        <div className="text-center py-16 text-text-secondary">
          <p className="text-4xl mb-3">📋</p>
          <p className="mb-2">No events yet</p>
          <p className="text-sm">Add your first event or import from a spreadsheet.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {sortedDates.map((dateKey) => (
            <section key={dateKey}>
              <h2 className="text-sm font-medium text-accent mb-3 sticky top-0 bg-background py-1 z-10">
                {formatDate(dateKey)}
              </h2>
              <div>
                {grouped[dateKey].map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    onEdit={setEditEvent}
                    onDelete={setDeleteId}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* Add Event Modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Event">
        <EventForm onSubmit={handleAdd} onCancel={() => setShowAdd(false)} />
      </Modal>

      {/* Edit Event Modal */}
      <Modal open={!!editEvent} onClose={() => setEditEvent(null)} title="Edit Event">
        {editEvent && (
          <EventForm
            initialData={{
              name: editEvent.name,
              type: editEvent.type,
              date: new Date(editEvent.date).toISOString().split("T")[0],
              time: editEvent.time || "",
              duration: editEvent.duration || "",
              location: editEvent.location || "",
              confirmationNumber: editEvent.confirmationNumber || "",
              notes: editEvent.notes || "",
            }}
            onSubmit={handleEdit}
            onCancel={() => setEditEvent(null)}
            submitLabel="Save Changes"
          />
        )}
      </Modal>

      {/* Import Modal */}
      <ImportModal
        open={showImport}
        onClose={() => setShowImport(false)}
        tripId={tripId}
        onImported={fetchEvents}
      />

      {/* Delete Confirmation */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Event">
        <p className="text-text-secondary mb-6">
          Are you sure you want to delete this event?
        </p>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => setDeleteId(null)} className="flex-1">
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete} className="flex-1">
            Delete
          </Button>
        </div>
      </Modal>
    </main>
  );
}
