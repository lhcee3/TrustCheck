import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// 5-second in-memory cache keyed by upiId+amount
const cache = new Map<string, { result: LLMResult; ts: number }>();

export interface LLMResult {
  riskScore: number;
  reasons: string[];
}

export async function analyzeTransactionRisk(
  recentTxHistory: { recipientUpi: string; amount: number; status: string; timestamp: string }[],
  currentTx: { upiId: string; amount: number; note?: string }
): Promise<LLMResult | null> {
  if (!process.env.GROQ_API_KEY) return null;

  const cacheKey = `${currentTx.upiId}:${currentTx.amount}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.ts < 5000) return cached.result;

  const historyStr = recentTxHistory.slice(0, 10).map((t) =>
    `- ${t.recipientUpi} ₹${t.amount} [${t.status}] ${t.timestamp}`
  ).join("\n");

  const prompt = `You are a UPI fraud detection system. Analyze this transaction and respond ONLY with valid JSON.

Recent transaction history:
${historyStr || "No history"}

Current transaction:
- Recipient UPI: ${currentTx.upiId}
- Amount: ₹${currentTx.amount}
- Note: ${currentTx.note || "none"}

Respond with exactly this JSON format (no markdown, no explanation):
{"riskScore": <0-100>, "reasons": ["<reason1>", "<reason2>"]}

riskScore 0=safe, 100=definite fraud. Keep reasons concise, max 3.`;

  try {
    const completion = await groq.chat.completions.create({
      model: "llama3-8b-8192",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 150,
      temperature: 0.1,
    });

    const text = completion.choices[0]?.message?.content?.trim() ?? "";
    const parsed = JSON.parse(text) as LLMResult;
    const result: LLMResult = {
      riskScore: Math.min(100, Math.max(0, Number(parsed.riskScore) || 0)),
      reasons: Array.isArray(parsed.reasons) ? parsed.reasons.slice(0, 3) : [],
    };
    cache.set(cacheKey, { result, ts: Date.now() });
    return result;
  } catch (e) {
    console.error("[LLM] analyzeTransactionRisk failed:", e);
    return null;
  }
}
