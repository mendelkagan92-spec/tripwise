import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

export async function GET(req: NextRequest) {
  try {
    const city = req.nextUrl.searchParams.get("city");

    const places = await prisma.place.findMany({
      where: city ? { city: { contains: city, mode: "insensitive" } } : {},
      include: {
        flags: true,
        tips: {
          include: {
            votes: true,
            user: { select: { name: true } },
          },
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    // Add computed vote counts
    const placesWithCounts = places.map((place) => ({
      ...place,
      flagCount: place.flags.length,
      tips: place.tips.map((tip) => ({
        ...tip,
        upvotes: tip.votes.length,
      })),
    }));

    return NextResponse.json(placesWithCounts);
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireSession();
    const { name, city, googlePlaceId, lat, lng } = await req.json();

    if (!name || !city) {
      return NextResponse.json({ error: "name and city required" }, { status: 400 });
    }

    // Find or create place
    const place = await prisma.place.upsert({
      where: googlePlaceId
        ? { googlePlaceId }
        : { name_city: { name, city } },
      create: { name, city, googlePlaceId, lat, lng },
      update: {},
    });

    return NextResponse.json(place);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
