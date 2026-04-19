// Google Safe Browsing API v4
// Free for non-commercial use — https://developers.google.com/safe-browsing/v4
// Default quota: 10,000 requests/day

const ENDPOINT = "https://safebrowsing.googleapis.com/v4/threatMatches:find";

const THREAT_TYPES = [
  "MALWARE",
  "SOCIAL_ENGINEERING",
  "UNWANTED_SOFTWARE",
  "POTENTIALLY_HARMFUL_APPLICATION",
];

export interface SafeBrowsingResult {
  isMalicious: boolean;
  threats: string[];
}

export async function checkUrlWithGoogleSafeBrowsing(
  url: string
): Promise<SafeBrowsingResult | null> {
  const apiKey = process.env.GOOGLE_SAFE_BROWSING_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch(`${ENDPOINT}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client: { clientId: "trustcheck", clientVersion: "1.0.0" },
        threatInfo: {
          threatTypes: THREAT_TYPES,
          platformTypes: ["ANY_PLATFORM"],
          threatEntryTypes: ["URL"],
          threatEntries: [{ url }],
        },
      }),
      signal: AbortSignal.timeout(5000),
    });

    // Rate limited — fall back gracefully
    if (res.status === 429) {
      console.warn("[SafeBrowsing] Rate limit hit — falling back");
      return null;
    }

    if (!res.ok) {
      console.error(`[SafeBrowsing] API error: ${res.status}`);
      return null;
    }

    const data = await res.json() as { matches?: { threatType: string }[] };

    if (!data.matches || data.matches.length === 0) {
      return { isMalicious: false, threats: [] };
    }

    return {
      isMalicious: true,
      threats: data.matches.map((m) => m.threatType),
    };
  } catch (e) {
    console.error("[SafeBrowsing] Request failed:", e);
    return null;
  }
}
