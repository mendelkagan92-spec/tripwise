import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const flags = await prisma.placeFlag.findMany({
      where: { placeId: params.id },
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(flags);
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireSession();
    const { type, note } = await req.json();

    if (!type) {
      return NextResponse.json({ error: "type required" }, { status: 400 });
    }

    const flag = await prisma.placeFlag.create({
      data: {
        placeId: params.id,
        userId: session.user.id,
        type,
        note: note || null,
      },
    });

    return NextResponse.json(flag, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
