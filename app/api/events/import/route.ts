import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

interface ImportRow {
  name: string;
  type?: string;
  date: string;
  time?: string;
  duration?: string;
  location?: string;
  confirmationNumber?: string;
  notes?: string;
}

const VALID_TYPES = ["Flight", "Hotel", "Restaurant", "Attraction", "Transport", "Other"];

function normalizeType(raw?: string): string {
  if (!raw) return "Other";
  const lower = raw.toLowerCase().trim();
  const found = VALID_TYPES.find((t) => t.toLowerCase() === lower);
  return found || "Other";
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    const body = await req.json();
    const { tripId, rows } = body as { tripId: string; rows: ImportRow[] };

    if (!tripId || !rows || !Array.isArray(rows)) {
      return NextResponse.json({ error: "Missing tripId or rows" }, { status: 400 });
    }

    // Verify trip ownership
    const trip = await prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip || trip.userId !== session.user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const created = await prisma.event.createMany({
      data: rows
        .filter((row) => row.name && row.date)
        .map((row) => ({
          tripId,
          name: row.name,
          type: normalizeType(row.type) as "Flight" | "Hotel" | "Restaurant" | "Attraction" | "Transport" | "Other",
          date: new Date(row.date),
          time: row.time || null,
          duration: row.duration || null,
          location: row.location || null,
          confirmationNumber: row.confirmationNumber || null,
          notes: row.notes || null,
        })),
    });

    return NextResponse.json({ count: created.count }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
