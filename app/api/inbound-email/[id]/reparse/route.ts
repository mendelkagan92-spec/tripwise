import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { parseEmail } from "@/lib/anthropic";

const VALID_EVENT_TYPES = ["Flight", "Hotel", "Restaurant", "Attraction", "Transport", "Other"];

function normalizeEventType(raw: string): string {
  if (VALID_EVENT_TYPES.includes(raw)) return raw;
  const lower = raw.toLowerCase();
  if (lower === "activity") return "Attraction";
  const found = VALID_EVENT_TYPES.find((t) => t.toLowerCase() === lower);
  return found || "Other";
}

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireSession();

    const email = await prisma.inboundEmail.findUnique({
      where: { id: params.id },
      include: { trip: true },
    });

    if (!email || email.trip.userId !== session.user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    try {
      const parsed = await parseEmail(email.bodyText);

      for (const reservation of parsed) {
        if (!reservation.name || !reservation.date) continue;

        const eventType = normalizeEventType(reservation.type || "Other");

        const event = await prisma.event.create({
          data: {
            tripId: email.tripId,
            name: reservation.name,
            type: eventType as "Flight" | "Hotel" | "Restaurant" | "Attraction" | "Transport" | "Other",
            date: new Date(reservation.date),
            time: reservation.time || null,
            duration: reservation.duration || null,
            location: reservation.location || null,
            confirmationNumber: reservation.confirmation_number || null,
            notes: reservation.notes || null,
          },
        });

        await prisma.reservation.create({
          data: {
            tripId: email.tripId,
            eventId: event.id,
            status: "Confirmed",
            rawEmailId: email.id,
          },
        });
      }

      await prisma.inboundEmail.update({
        where: { id: email.id },
        data: { parsedAt: new Date(), parseSuccess: true },
      });

      return NextResponse.json({ success: true, count: parsed.length });
    } catch {
      await prisma.inboundEmail.update({
        where: { id: email.id },
        data: { parsedAt: new Date(), parseSuccess: false },
      });
      return NextResponse.json({ error: "Parse failed" }, { status: 500 });
    }
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
