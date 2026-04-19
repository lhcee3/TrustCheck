// Run: node scripts/test-gemini.js
// Requires GEMINI_API_KEY in .env.local

const fs = require("fs");
const path = require("path");

// Load .env.local manually
const envPath = path.join(__dirname, "..", ".env.local");
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, "utf-8").split("\n").forEach((line) => {
    const [key, ...rest] = line.replace(/^#.*/, "").split("=");
    if (key?.trim()) process.env[key.trim()] = rest.join("=").trim().replace(/^"|"$/g, "");
  });
}

const { GoogleGenerativeAI } = require("@google/generative-ai");

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) { console.error("❌ GEMINI_API_KEY not set in .env.local"); process.exit(1); }

const client = new GoogleGenerativeAI(apiKey);
const model = client.getGenerativeModel({ model: "gemini-1.5-flash" });

async function testDecision(label, inputs) {
  const prompt = `You are TrustCheck, an AI fraud detection system for Indian UPI payments.

Analyze this transaction and decide if it should be ALLOWED or BLOCKED.

Transaction details:
- Recipient UPI: ${inputs.upiId}
- Amount: ₹${inputs.amount}
- Rule-based risk score: ${inputs.riskScore}/100
- Phishing detected: ${inputs.phishingFlag}
- First-time recipient: ${inputs.isFirstTimeRecipient}
- User's average transaction: ₹${inputs.userAvgAmount}
- Risk reasons: ${inputs.reasons.join(", ") || "none"}

Respond in JSON format only, no markdown:
{"finalDecision":"allow or block","explanation":"short reason max 100 chars","confidenceScore":0-100}`;

  try {
    const result = await Promise.race([
      model.generateContent(prompt),
      new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 5000)),
    ]);
    const text = result.response.text().trim()
      .replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
    const parsed = JSON.parse(text);
    console.log(`\n✅ [${label}]`);
    console.log(`   Decision:    ${parsed.finalDecision.toUpperCase()}`);
    console.log(`   Explanation: ${parsed.explanation}`);
    console.log(`   Confidence:  ${parsed.confidenceScore}/100`);
  } catch (e) {
    console.error(`\n❌ [${label}] Failed:`, e.message);
  }
}

async function main() {
  console.log("=== TrustCheck Gemini Decision Engine Test ===\n");

  await testDecision("SCAM UPI — scammer@okhdfcbank", {
    upiId: "scammer@okhdfcbank",
    amount: 25000,
    riskScore: 92,
    phishingFlag: false,
    isFirstTimeRecipient: true,
    userAvgAmount: 2000,
    reasons: ["Recipient flagged in fraud database", "12 fraud complaints on record", "Amount unusually high"],
  });

  await testDecision("SAFE UPI — friend@okicici", {
    upiId: "friend@okicici",
    amount: 500,
    riskScore: 10,
    phishingFlag: false,
    isFirstTimeRecipient: false,
    userAvgAmount: 2000,
    reasons: [],
  });

  console.log("\n=== Done ===");
}

main().catch(console.error);
