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

export async function GET(req: NextRequest) {
  try {
    const session = await requireSession();
    const tripId = req.nextUrl.searchParams.get("tripId");

    if (!tripId) {
      return NextResponse.json({ error: "tripId required" }, { status: 400 });
    }

    const trip = await prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip || trip.userId !== session.user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const emails = await prisma.inboundEmail.findMany({
      where: { tripId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(emails);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Postmark inbound webhook payload fields
    const toEmail = body.ToFull?.[0]?.Email || body.To || "";
    const fromEmail = body.FromFull?.Email || body.From || "";
    const subject = body.Subject || "";
    const textBody = body.TextBody || body.HtmlBody || "";

    if (!toEmail || !textBody) {
      return NextResponse.json({ error: "Missing email data" }, { status: 400 });
    }

    // Find the trip by the recipient email address
    const tripEmail = await prisma.tripEmail.findUnique({
      where: { address: toEmail.toLowerCase() },
      include: { trip: true },
    });

    if (!tripEmail) {
      return NextResponse.json({ error: "Unknown recipient" }, { status: 404 });
    }

    // Store the raw email
    const inboundEmail = await prisma.inboundEmail.create({
      data: {
        tripId: tripEmail.tripId,
        fromEmail,
        subject,
        bodyText: textBody.slice(0, 50000),
      },
    });

    // Parse with Claude
    try {
      const parsed = await parseEmail(textBody);

      for (const reservation of parsed) {
        if (!reservation.name || !reservation.date) continue;

        const eventType = normalizeEventType(reservation.type || "Other");

        const event = await prisma.event.create({
          data: {
            tripId: tripEmail.tripId,
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
            tripId: tripEmail.tripId,
            eventId: event.id,
            status: "Confirmed",
            rawEmailId: inboundEmail.id,
          },
        });
      }

      await prisma.inboundEmail.update({
        where: { id: inboundEmail.id },
        data: { parsedAt: new Date(), parseSuccess: true },
      });
    } catch {
      await prisma.inboundEmail.update({
        where: { id: inboundEmail.id },
        data: { parsedAt: new Date(), parseSuccess: false },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Inbound email error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
