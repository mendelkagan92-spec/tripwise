"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

interface InboundEmail {
  id: string;
  fromEmail: string;
  subject: string;
  bodyText: string;
  parsedAt: string | null;
  parseSuccess: boolean;
  createdAt: string;
}

interface TripWithEmail {
  id: string;
  tripEmail: { address: string } | null;
}

export default function InboxPage() {
  const params = useParams();
  const tripId = params.id as string;

  const [emails, setEmails] = useState<InboundEmail[]>([]);
  const [tripEmail, setTripEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchData = useCallback(async () => {
    const [emailsRes, tripRes] = await Promise.all([
      fetch(`/api/inbound-email?tripId=${tripId}`),
      fetch(`/api/trips/${tripId}`),
    ]);

    if (emailsRes.ok) {
      setEmails(await emailsRes.json());
    }
    if (tripRes.ok) {
      const trip: TripWithEmail = await tripRes.json();
      setTripEmail(trip.tripEmail?.address || null);
    }
    setLoading(false);
  }, [tripId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCopy = async () => {
    if (tripEmail) {
      await navigator.clipboard.writeText(tripEmail);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleReparse = async (emailId: string) => {
    const res = await fetch(`/api/inbound-email/${emailId}/reparse`, {
      method: "POST",
    });
    if (res.ok) {
      fetchData();
    }
  };

  return (
    <main className="px-4 py-6 max-w-lg mx-auto">
      <h1 className="font-heading text-2xl font-bold mb-4">Inbox</h1>

      {/* Trip email address */}
      {tripEmail && (
        <div className="bg-surface border border-border rounded-xl p-4 mb-6">
          <p className="text-xs text-text-secondary mb-2">Forward confirmation emails to:</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-sm text-accent bg-background rounded-lg px-3 py-2 truncate">
              {tripEmail}
            </code>
            <Button size="sm" variant="secondary" onClick={handleCopy}>
              {copied ? "Copied!" : "Copy"}
            </Button>
          </div>
          <p className="text-xs text-text-secondary mt-2">
            Works with airlines, hotels, restaurants, and activity bookings. AI will automatically parse and create reservations.
          </p>
        </div>
      )}

      {loading ? (
        <p className="text-text-secondary text-center py-12">Loading...</p>
      ) : emails.length === 0 ? (
        <div className="text-center py-16 text-text-secondary">
          <p className="text-4xl mb-3">📧</p>
          <p className="mb-2">No emails yet</p>
          <p className="text-sm">Forward your booking confirmations to the address above.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {emails.map((email) => (
            <div key={email.id} className="bg-surface border border-border rounded-xl overflow-hidden">
              <button
                onClick={() => setExpandedId(expandedId === email.id ? null : email.id)}
                className="w-full text-left p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{email.subject || "No subject"}</p>
                    <p className="text-xs text-text-secondary mt-0.5 truncate">
                      From: {email.fromEmail}
                    </p>
                    <p className="text-xs text-text-secondary">
                      {new Date(email.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <div className="shrink-0">
                    {email.parsedAt ? (
                      email.parseSuccess ? (
                        <Badge variant="success">Parsed</Badge>
                      ) : (
                        <Badge variant="error">Failed</Badge>
                      )
                    ) : (
                      <Badge variant="warning">Pending</Badge>
                    )}
                  </div>
                </div>
              </button>

              {expandedId === email.id && (
                <div className="px-4 pb-4 border-t border-border pt-3">
                  <pre className="text-xs text-text-secondary whitespace-pre-wrap max-h-40 overflow-y-auto mb-3">
                    {email.bodyText.slice(0, 2000)}
                    {email.bodyText.length > 2000 ? "..." : ""}
                  </pre>
                  {(!email.parseSuccess || !email.parsedAt) && (
                    <Button size="sm" variant="secondary" onClick={() => handleReparse(email.id)}>
                      Re-parse with AI
                    </Button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
