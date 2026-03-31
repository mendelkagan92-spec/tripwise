import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string; tipId: string } }
) {
  try {
    const session = await requireSession();

    // Toggle vote
    const existing = await prisma.tipVote.findUnique({
      where: {
        tipId_userId: {
          tipId: params.tipId,
          userId: session.user.id,
        },
      },
    });

    if (existing) {
      await prisma.tipVote.delete({ where: { id: existing.id } });
      return NextResponse.json({ voted: false });
    } else {
      await prisma.tipVote.create({
        data: {
          tipId: params.tipId,
          userId: session.user.id,
        },
      });
      return NextResponse.json({ voted: true });
    }
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
