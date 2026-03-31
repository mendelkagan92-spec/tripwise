import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

export async function GET(req: NextRequest) {
  try {
    const session = await requireSession();
    const tripId = req.nextUrl.searchParams.get("tripId");

    if (!tripId) {
      return NextResponse.json({ error: "tripId required" }, { status: 400 });
    }

    // Verify trip ownership
    const trip = await prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip || trip.userId !== session.user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const events = await prisma.event.findMany({
      where: { tripId },
      orderBy: [{ date: "asc" }, { time: "asc" }],
    });

    return NextResponse.json(events);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    const body = await req.json();
    const { tripId, name, type, date, time, duration, location, confirmationNumber, notes } = body;

    if (!tripId || !name || !type || !date) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Verify trip ownership
    const trip = await prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip || trip.userId !== session.user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const event = await prisma.event.create({
      data: {
        tripId,
        name,
        type,
        date: new Date(date),
        time: time || null,
        duration: duration || null,
        location: location || null,
        confirmationNumber: confirmationNumber || null,
        notes: notes || null,
      },
    });

    return NextResponse.json(event, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
