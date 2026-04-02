const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

const INNERTUBE_VERSION = "20.10.38";
const INNERTUBE_USER_AGENT = `com.google.android.youtube/${INNERTUBE_VERSION} (Linux; U; Android 14)`;

interface TranscriptItem {
  text: string;
  offset: number;
  duration: number;
}

export async function fetchTranscript(videoId: string): Promise<string> {
  // Method 1: Try innertube API (works from server environments)
  try {
    const innertubeResult = await fetchViaInnertube(videoId);
    if (innertubeResult) return innertubeResult;
  } catch (e) {
    console.log("[YouTube] Innertube method failed:", e);
  }

  // Method 2: Scrape the watch page for caption tracks
  try {
    const webResult = await fetchViaWebPage(videoId);
    if (webResult) return webResult;
  } catch (e) {
    console.log("[YouTube] Web page method failed:", e);
  }

  throw new Error("Could not fetch transcript from any method");
}

async function fetchViaInnertube(videoId: string): Promise<string | null> {
  const response = await fetch(
    "https://www.youtube.com/youtubei/v1/player?prettyPrint=false",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": INNERTUBE_USER_AGENT,
      },
      body: JSON.stringify({
        context: {
          client: {
            clientName: "ANDROID",
            clientVersion: INNERTUBE_VERSION,
          },
        },
        videoId,
      }),
    }
  );

  if (!response.ok) {
    console.log("[YouTube] Innertube response status:", response.status);
    return null;
  }

  const data = await response.json();

  if (data?.playabilityStatus?.status === "ERROR") {
    console.log("[YouTube] Video unavailable:", data.playabilityStatus.reason);
    throw new Error(data.playabilityStatus.reason || "Video unavailable");
  }

  const tracks =
    data?.captions?.playerCaptionsTracklistRenderer?.captionTracks;

  if (!Array.isArray(tracks) || tracks.length === 0) {
    console.log("[YouTube] No caption tracks found via innertube");
    return null;
  }

  // Prefer English, fall back to first available
  const track =
    tracks.find((t: { languageCode: string }) => t.languageCode === "en") ||
    tracks[0];

  return await fetchTranscriptFromUrl(track.baseUrl);
}

async function fetchViaWebPage(videoId: string): Promise<string | null> {
  const response = await fetch(
    `https://www.youtube.com/watch?v=${videoId}`,
    {
      headers: {
        "User-Agent": USER_AGENT,
        "Accept-Language": "en-US,en;q=0.9",
      },
    }
  );

  if (!response.ok) {
    console.log("[YouTube] Watch page response status:", response.status);
    return null;
  }

  const html = await response.text();

  if (html.includes('class="g-recaptcha"')) {
    console.log("[YouTube] Got CAPTCHA page");
    return null;
  }

  // Parse ytInitialPlayerResponse using brace-counting (more reliable than regex)
  const parsed = parseInlineJson(html, "ytInitialPlayerResponse");
  if (!parsed) {
    console.log("[YouTube] Could not find/parse player response in page");
    return null;
  }

  if (parsed?.playabilityStatus?.status === "ERROR") {
    console.log("[YouTube] Video unavailable via web:", parsed.playabilityStatus.reason);
    throw new Error(parsed.playabilityStatus.reason || "Video unavailable");
  }

  const tracks =
    parsed?.captions?.playerCaptionsTracklistRenderer?.captionTracks;

  if (!Array.isArray(tracks) || tracks.length === 0) {
    console.log("[YouTube] No caption tracks in player response for", videoId);
    return null;
  }

  const track =
    tracks.find((t: { languageCode: string }) => t.languageCode === "en") ||
    tracks[0];

  return await fetchTranscriptFromUrl(track.baseUrl);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseInlineJson(html: string, varName: string): any {
  const searchStr = `var ${varName} = `;
  const idx = html.indexOf(searchStr);
  if (idx === -1) return null;

  const start = idx + searchStr.length;
  let depth = 0;
  for (let i = start; i < html.length; i++) {
    if (html[i] === "{") depth++;
    else if (html[i] === "}") {
      depth--;
      if (depth === 0) {
        try {
          return JSON.parse(html.slice(start, i + 1));
        } catch {
          return null;
        }
      }
    }
  }
  return null;
}

async function fetchTranscriptFromUrl(
  baseUrl: string
): Promise<string | null> {
  // Validate URL is from YouTube
  try {
    const urlObj = new URL(baseUrl);
    if (!urlObj.hostname.endsWith(".youtube.com")) {
      console.log("[YouTube] Invalid transcript URL hostname:", urlObj.hostname);
      return null;
    }
  } catch {
    return null;
  }

  const response = await fetch(baseUrl, {
    headers: { "User-Agent": USER_AGENT },
  });

  if (!response.ok) {
    console.log("[YouTube] Transcript fetch status:", response.status);
    return null;
  }

  const xml = await response.text();

  if (!xml || xml.length === 0) {
    console.log("[YouTube] Transcript XML is empty");
    return null;
  }

  return parseTranscriptXml(xml);
}

function parseTranscriptXml(xml: string): string | null {
  const items: TranscriptItem[] = [];

  // Try srv3/JSON3 format first (<p t="..." d="...">)
  const pRegex = /<p\s+t="(\d+)"\s+d="(\d+)"[^>]*>([\s\S]*?)<\/p>/g;
  let match;
  while ((match = pRegex.exec(xml)) !== null) {
    // Extract text from <s> segments if present, otherwise strip tags
    let text = "";
    const sRegex = /<s[^>]*>([^<]*)<\/s>/g;
    let sMatch;
    while ((sMatch = sRegex.exec(match[3])) !== null) {
      text += sMatch[1];
    }
    if (!text) {
      text = match[3].replace(/<[^>]+>/g, "");
    }
    text = decodeEntities(text).trim();
    if (text) {
      items.push({
        text,
        offset: parseInt(match[1]),
        duration: parseInt(match[2]),
      });
    }
  }

  // Fall back to legacy format (<text start="..." dur="...">)
  if (items.length === 0) {
    const textRegex = /<text start="([^"]*)" dur="([^"]*)">([^<]*)<\/text>/g;
    while ((match = textRegex.exec(xml)) !== null) {
      const text = decodeEntities(match[3]).trim();
      if (text) {
        items.push({
          text,
          offset: parseFloat(match[1]),
          duration: parseFloat(match[2]),
        });
      }
    }
  }

  if (items.length === 0) {
    console.log("[YouTube] No transcript segments found in XML");
    return null;
  }

  console.log(`[YouTube] Parsed ${items.length} transcript segments`);
  return items.map((i) => i.text).join(" ");
}

function decodeEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) =>
      String.fromCodePoint(parseInt(hex, 16))
    )
    .replace(/&#(\d+);/g, (_, dec) =>
      String.fromCodePoint(parseInt(dec, 10))
    );
}
