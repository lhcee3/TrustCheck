const FEED_URL = "https://openphish.com/feed.txt";
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

let cachedUrls: Set<string> | null = null;
let cacheTimestamp = 0;

async function getFeed(): Promise<Set<string>> {
  const now = Date.now();
  if (cachedUrls && now - cacheTimestamp < CACHE_TTL_MS) return cachedUrls;

  const res = await fetch(FEED_URL, { next: { revalidate: 1800 } });
  if (!res.ok) throw new Error(`OpenPhish feed fetch failed: ${res.status}`);

  const text = await res.text();
  cachedUrls = new Set(
    text
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
  );
  cacheTimestamp = now;
  return cachedUrls;
}

export async function checkOpenPhish(
  url: string
): Promise<{ isPhishing: boolean; source: "OpenPhish" }> {
  try {
    const feed = await getFeed();
    return { isPhishing: feed.has(url.trim()), source: "OpenPhish" };
  } catch {
    // Fail open — don't block the user if the feed is unavailable
    return { isPhishing: false, source: "OpenPhish" };
  }
}
