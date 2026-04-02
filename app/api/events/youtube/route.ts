import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/session";
import { fetchTranscript } from "@/lib/youtube-transcript";
import Anthropic from "@anthropic-ai/sdk";

const SYSTEM_PROMPT = `You are a travel planning assistant. The user has provided a transcript from a travel YouTube video. Extract every specific place, restaurant, attraction, hotel, and activity mentioned and create a structured day-by-day itinerary. For each item return: name, type (Restaurant/Attraction/Hotel/Transport/Other), suggested_day (number starting from 1), suggested_time (HH:MM format, estimate reasonable times like 09:00 for morning activities, 12:30 for lunch, 19:00 for dinner), location (address or area if mentioned), duration (e.g. "2h", "1h30m"), and notes (any tips mentioned in the video). Return as a JSON array. Only return valid JSON — no text outside the array.`;

function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

export async function POST(req: NextRequest) {
  try {
    await requireSession();
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: "URL required" }, { status: 400 });
    }

    const videoId = extractVideoId(url);
    if (!videoId) {
      return NextResponse.json({ error: "Invalid YouTube URL" }, { status: 400 });
    }

    console.log(`[YouTube Import] Processing video: ${videoId}`);

    // Fetch transcript
    let transcriptText: string;
    try {
      transcriptText = await fetchTranscript(videoId);
      console.log(`[YouTube Import] Transcript fetched, length: ${transcriptText.length}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      console.error("[YouTube Import] Transcript fetch failed:", message);
      if (message.includes("unavailable")) {
        return NextResponse.json(
          { error: "This video is unavailable. It may have been deleted or made private." },
          { status: 422 }
        );
      }
      return NextResponse.json(
        { error: "Could not fetch transcript. The video may not have captions enabled." },
        { status: 422 }
      );
    }

    if (!transcriptText || transcriptText.trim().length < 50) {
      console.log("[YouTube Import] Transcript too short:", transcriptText?.length);
      return NextResponse.json(
        { error: "Transcript is too short or empty. This video may not have useful captions." },
        { status: 422 }
      );
    }

    // Truncate very long transcripts to stay within token limits
    const maxChars = 30000;
    const truncated = transcriptText.length > maxChars
      ? transcriptText.slice(0, maxChars) + "..."
      : transcriptText;

    // Send to Claude
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    console.log("[YouTube Import] Sending to Claude API...");

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Here is the transcript from a travel YouTube video. Extract all places and create a day-by-day itinerary:\n\n${truncated}`,
        },
      ],
    });

    const responseText = message.content
      .filter((block) => block.type === "text")
      .map((block) => (block.type === "text" ? block.text : ""))
      .join("");

    console.log("[YouTube Import] Claude response length:", responseText.length);

    let items;
    try {
      items = JSON.parse(responseText);
      if (!Array.isArray(items)) {
        items = [items];
      }
    } catch {
      console.error("[YouTube Import] Failed to parse Claude response:", responseText.slice(0, 200));
      return NextResponse.json(
        { error: "Failed to parse AI response. The video may not contain travel content." },
        { status: 422 }
      );
    }

    console.log(`[YouTube Import] Successfully extracted ${items.length} items`);
    return NextResponse.json({ items, videoId });
  } catch (error) {
    console.error("[YouTube Import] Unexpected error:", error);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
