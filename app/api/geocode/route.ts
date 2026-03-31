import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { geocodeAddress } from "@/lib/geocode";

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    const { eventId, address } = await req.json();

    if (!eventId || !address) {
      return NextResponse.json({ error: "eventId and address required" }, { status: 400 });
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: { trip: true },
    });

    if (!event || event.trip.userId !== session.user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Return cached coordinates if available
    if (event.lat !== null && event.lng !== null) {
      return NextResponse.json({ lat: event.lat, lng: event.lng });
    }

    const result = await geocodeAddress(address);
    if (!result) {
      return NextResponse.json({ error: "Geocoding failed" }, { status: 422 });
    }

    // Cache coordinates in DB
    await prisma.event.update({
      where: { id: eventId },
      data: { lat: result.lat, lng: result.lng },
    });

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
