import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireSession();
    const body = await req.json();

    const event = await prisma.event.findUnique({
      where: { id: params.id },
      include: { trip: true },
    });
    if (!event || event.trip.userId !== session.user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const updated = await prisma.event.update({
      where: { id: params.id },
      data: {
        name: body.name ?? event.name,
        type: body.type ?? event.type,
        date: body.date ? new Date(body.date) : event.date,
        time: body.time !== undefined ? body.time : event.time,
        duration: body.duration !== undefined ? body.duration : event.duration,
        location: body.location !== undefined ? body.location : event.location,
        confirmationNumber: body.confirmationNumber !== undefined ? body.confirmationNumber : event.confirmationNumber,
        notes: body.notes !== undefined ? body.notes : event.notes,
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

    const event = await prisma.event.findUnique({
      where: { id: params.id },
      include: { trip: true },
    });
    if (!event || event.trip.userId !== session.user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.event.delete({ where: { id: params.id } });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
