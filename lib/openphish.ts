// Real OpenPhish feed — cached 15 minutes
let feedCache: Set<string> | null = null;
let cacheTs = 0;
const CACHE_MS = 15 * 60 * 1000;

const FALLBACK = new Set([
  "sbi-update.vercel.app", "hdfc-verification.com", "paytm-kyc-update.net",
  "icici-secure-login.xyz", "upi-reward-claim.in", "axis-bank-alert.tk",
]);

function normalize(url: string): string {
  return url.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0];
}

async function getFeed(): Promise<Set<string>> {
  if (feedCache && Date.now() - cacheTs < CACHE_MS) return feedCache;
  try {
    const res = await fetch("https://openphish.com/feed.txt", { next: { revalidate: 900 } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    feedCache = new Set(text.split("\n").map(normalize).filter(Boolean));
    cacheTs = Date.now();
    return feedCache;
  } catch {
    return FALLBACK;
  }
}

export async function checkOpenPhish(url: string): Promise<{ isPhishing: boolean; source: "OpenPhish" }> {
  const feed = await getFeed();
  const normalized = normalize(url);
  const isPhishing = feed.has(normalized) || [...feed].some((u) => normalized.includes(u));
  return { isPhishing, source: "OpenPhish" };
}
