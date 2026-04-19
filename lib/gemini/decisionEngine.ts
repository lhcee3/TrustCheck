import { geminiModel } from "./client";

export interface GeminiDecision {
  finalDecision: "allow" | "block";
  explanation: string;
  confidenceScore: number;
}

const FALLBACK = (riskScore: number): GeminiDecision => ({
  finalDecision: riskScore >= 70 ? "block" : "allow",
  explanation: riskScore >= 70 ? "High rule-based risk score" : "Rule-based check passed",
  confidenceScore: 50,
});

export async function getGeminiDecision(inputs: {
  upiId: string;
  amount: number;
  riskScore: number;
  phishingFlag: boolean;
  isFirstTimeRecipient: boolean;
  userAvgAmount: number;
  reasons: string[];
}): Promise<GeminiDecision> {
  if (!geminiModel) return FALLBACK(inputs.riskScore);

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
      geminiModel.generateContent(prompt),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error("timeout")), 5000)),
    ]);

    const text = result.response.text().trim()
      .replace(/^```json\s*/i, "").replace(/```$/i, "").trim();

    const parsed = JSON.parse(text) as GeminiDecision;
    return {
      finalDecision: parsed.finalDecision === "block" ? "block" : "allow",
      explanation: String(parsed.explanation ?? "").slice(0, 100),
      confidenceScore: Math.min(100, Math.max(0, Number(parsed.confidenceScore) || 50)),
    };
  } catch (e) {
    console.error("[Gemini] Decision failed:", e);
    return FALLBACK(inputs.riskScore);
  }
}
