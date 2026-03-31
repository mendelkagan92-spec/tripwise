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

    const trip = await prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip || trip.userId !== session.user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const reservations = await prisma.reservation.findMany({
      where: { tripId },
      include: {
        event: true,
        inboundEmail: {
          select: { subject: true, fromEmail: true },
        },
      },
      orderBy: { event: { date: "asc" } },
    });

    return NextResponse.json(reservations);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
