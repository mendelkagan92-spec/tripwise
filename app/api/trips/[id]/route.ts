import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireSession();
    const trip = await prisma.trip.findUnique({
      where: { id: params.id },
      include: { tripEmail: true },
    });
    if (!trip || trip.userId !== session.user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(trip);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireSession();
    const body = await req.json();

    const trip = await prisma.trip.findUnique({ where: { id: params.id } });
    if (!trip || trip.userId !== session.user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const updated = await prisma.trip.update({
      where: { id: params.id },
      data: {
        name: body.name ?? trip.name,
        destination: body.destination ?? trip.destination,
        emoji: body.emoji ?? trip.emoji,
        startDate: body.startDate ? new Date(body.startDate) : trip.startDate,
        endDate: body.endDate ? new Date(body.endDate) : trip.endDate,
      },
    });

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireSession();

    const trip = await prisma.trip.findUnique({ where: { id: params.id } });
    if (!trip || trip.userId !== session.user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.trip.delete({ where: { id: params.id } });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
