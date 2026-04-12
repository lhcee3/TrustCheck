// Run with: node scripts/test-apis.js
// Requires the Next.js dev server to be running on localhost:3000

const BASE = "http://localhost:3000";

async function get(path) {
  const res = await fetch(`${BASE}${path}`);
  return res.json();
}

async function post(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
}

function print(label, result) {
  console.log(`\n[${label}]`);
  console.log(JSON.stringify(result, null, 2));
}

async function main() {
  console.log("=== TrustCheck API Tests ===");

  // 1. /api/check-recipient
  print(
    "check-recipient | scammer@okhdfcbank (expect flagged: true)",
    await post("/api/check-recipient", { upiId: "scammer@okhdfcbank" })
  );

  print(
    "check-recipient | friend@okicici (expect flagged: false)",
    await post("/api/check-recipient", { upiId: "friend@okicici" })
  );

  // 2. /api/check-link
  print(
    "check-link | https://example.com (expect safe / ALLOW)",
    await get("/api/check-link?url=https://example.com")
  );

  // Fetch a real URL from the OpenPhish feed to use as a known phishing URL
  let phishUrl = null;
  try {
    const feedRes = await fetch("https://openphish.com/feed.txt");
    const text = await feedRes.text();
    phishUrl = text.split("\n").map((l) => l.trim()).find(Boolean) ?? null;
  } catch {
    console.warn("\n[check-link | OpenPhish URL] Could not fetch feed — skipping");
  }

  if (phishUrl) {
    print(
      `check-link | ${phishUrl} (expect flagged by OpenPhish)`,
      await get(`/api/check-link?url=${encodeURIComponent(phishUrl)}`)
    );
  }

  // 3. /api/check-account
  print(
    "check-account | scammer@okhdfcbank (expect found: true, recommendation: HOLD)",
    await get("/api/check-account?upiId=scammer@okhdfcbank")
  );

  print(
    "check-account | unknown@random (expect found: false, recommendation: ALLOW)",
    await get("/api/check-account?upiId=unknown@random")
  );
}

main().catch((err) => {
  console.error("\nFailed to run tests:", err.message);
  process.exit(1);
});
