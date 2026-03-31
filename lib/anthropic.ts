import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `You are a travel assistant. Extract structured reservation data from this confirmation email. Return JSON with fields: type (Flight/Hotel/Restaurant/Activity), name, date (YYYY-MM-DD), time (HH:MM), confirmation_number, location, duration, notes. If multiple reservations exist in one email, return an array. Always return valid JSON — either a single object or an array of objects. Do not include any text outside the JSON.`;

interface ParsedReservation {
  type: string;
  name: string;
  date: string;
  time: string | null;
  confirmation_number: string | null;
  location: string | null;
  duration: string | null;
  notes: string | null;
}

export async function parseEmail(emailBody: string): Promise<ParsedReservation[]> {
  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2048,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Parse the following confirmation email and extract reservation data:\n\n${emailBody}`,
      },
    ],
  });

  const text = message.content
    .filter((block) => block.type === "text")
    .map((block) => {
      if (block.type === "text") return block.text;
      return "";
    })
    .join("");

  const parsed = JSON.parse(text);
  return Array.isArray(parsed) ? parsed : [parsed];
}
