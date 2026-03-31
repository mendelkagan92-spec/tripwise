import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { generateTripEmail } from "@/lib/email-address";

export async function GET() {
  try {
    const session = await requireSession();
    const trips = await prisma.trip.findMany({
      where: { userId: session.user.id },
      orderBy: { startDate: "asc" },
      include: { tripEmail: true },
    });
    return NextResponse.json(trips);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    const body = await req.json();
    const { name, destination, emoji, startDate, endDate } = body;

    if (!name || !destination || !startDate || !endDate) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const trip = await prisma.trip.create({
      data: {
        userId: session.user.id,
        name,
        destination,
        emoji: emoji || "✈️",
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        tripEmail: {
          create: {
            address: generateTripEmail(destination),
          },
        },
      },
      include: { tripEmail: true },
    });

    return NextResponse.json(trip, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
