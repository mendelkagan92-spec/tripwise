import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tips = await prisma.placeTip.findMany({
      where: { placeId: params.id },
      include: {
        user: { select: { name: true } },
        votes: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const tipsWithUpvotes = tips
      .map((tip) => ({
        ...tip,
        upvotes: tip.votes.length,
      }))
      .sort((a, b) => b.upvotes - a.upvotes);

    return NextResponse.json(tipsWithUpvotes);
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
    const { content } = await req.json();

    if (!content) {
      return NextResponse.json({ error: "content required" }, { status: 400 });
    }

    const tip = await prisma.placeTip.create({
      data: {
        placeId: params.id,
        userId: session.user.id,
        content,
      },
    });

    return NextResponse.json(tip, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
