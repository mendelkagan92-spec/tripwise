const FIELD_PATTERNS: Record<string, string[]> = {
  date: ["date", "day", "when", "start date", "event date"],
  time: ["time", "start time", "starts", "departure", "departure time", "arrival time"],
  type: ["type", "category", "kind", "event type"],
  name: ["name", "activity", "event", "title", "description", "what"],
  location: ["location", "place", "address", "where", "venue"],
  duration: ["duration", "length", "how long", "hours"],
  confirmationNumber: ["confirmation", "conf #", "conf", "booking ref", "reference", "booking", "ref", "reservation #", "confirmation number", "booking number"],
  notes: ["notes", "comments", "details", "info", "additional"],
};

function normalize(str: string): string {
  return str.toLowerCase().trim().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ");
}

function similarity(a: string, b: string): number {
  const na = normalize(a);
  const nb = normalize(b);

  if (na === nb) return 1;
  if (na.includes(nb) || nb.includes(na)) return 0.8;

  // Simple word overlap
  const wordsA = na.split(" ");
  const wordsB = nb.split(" ");
  const overlap = wordsA.filter((w) => wordsB.includes(w)).length;
  if (overlap > 0) return overlap / Math.max(wordsA.length, wordsB.length) * 0.6;

  return 0;
}

export function matchColumns(headers: string[]): Record<string, string | null> {
  const mapping: Record<string, string | null> = {};

  for (const field of Object.keys(FIELD_PATTERNS)) {
    let bestMatch: string | null = null;
    let bestScore = 0;

    for (const header of headers) {
      for (const pattern of FIELD_PATTERNS[field]) {
        const score = similarity(header, pattern);
        if (score > bestScore && score >= 0.4) {
          bestScore = score;
          bestMatch = header;
        }
      }
    }

    mapping[field] = bestMatch;
  }

  return mapping;
}

export function getAvailableFields(): string[] {
  return Object.keys(FIELD_PATTERNS);
}
