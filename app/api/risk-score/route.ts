import { NextRequest, NextResponse } from "next/server";
import { findAccountByUpiId } from "@/lib/mockData";
import { analyzeTransaction, recordTransaction, getProfile_public } from "@/lib/trustcheckAgent";
import { readData, writeData } from "@/lib/dataStore";
import { publishTransactionEvent } from "@/lib/qstash/producer";
import { analyzeTransactionRisk } from "@/lib/llm/behaviorAnalyzer";
import { getGeminiDecision } from "@/lib/gemini/decisionEngine";

interface Notification { id: string; userId: string; type: string; title: string; body: string; read: boolean; timestamp: string; }
interface Transaction { id: string; recipientUpi: string; amount: number; status: string; timestamp: string; [key: string]: unknown; }

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: cors });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { upiId, amount = 0, userId = "default", record = false } = body as {
      upiId?: string; amount?: number; userId?: string; record?: boolean;
    };

    if (!upiId || typeof upiId !== "string") {
      return NextResponse.json({ error: "upiId is required" }, { status: 400, headers: cors });
    }

    // ── 1. Scam DB lookup ────────────────────────────────────────────────────
    const { found, isScam, riskScore: dbScore, complaints } = await findAccountByUpiId(upiId);

    // ── 2. Rule-based engine ─────────────────────────────────────────────────
    const ruleResult = analyzeTransaction({
      userId, upiId, amount,
      recipientRiskScore: isScam ? dbScore : 0,
      recipientComplaints: complaints,
      recipientFound: found && isScam,
    });

    // ── 3. Groq LLM behavior analysis — non-blocking ─────────────────────────
    let llmScore = 0;
    let llmReasons: string[] = [];
    try {
      const txHistory = readData<Transaction[]>("transactions.json")
        .filter((t) => t.userId === "user_ramesh_001")
        .slice(0, 10)
        .map((t) => ({ recipientUpi: t.recipientUpi, amount: t.amount, status: t.status, timestamp: t.timestamp }));
      const llm = await analyzeTransactionRisk(txHistory, { upiId, amount });
      if (llm) { llmScore = llm.riskScore; llmReasons = llm.reasons; }
    } catch { /* non-fatal */ }

    // ── 4. Combined score: 60% rule + 40% LLM ───────────────────────────────
    const combinedScore = Math.min(100, Math.round(0.6 * ruleResult.riskScore + 0.4 * llmScore));
    const allReasons = [...ruleResult.reasons, ...llmReasons.filter((r) => !ruleResult.reasons.includes(r))];
    const level = combinedScore >= 70 ? "high" : combinedScore >= 30 ? "medium" : "low";
    let flagged = level === "high";

    // ── 5. Gemini decision engine ────────────────────────────────────────────
    const profile = getProfile_public(userId);
    const isFirstTimeRecipient = !profile.knownRecipients.includes(upiId.toLowerCase());

    const gemini = await getGeminiDecision({
      upiId, amount,
      riskScore: combinedScore,
      phishingFlag: false,
      isFirstTimeRecipient,
      userAvgAmount: profile.avgAmount,
      reasons: allReasons,
    });

    // Conservative: block if either engine says block
    if (gemini.finalDecision === "block") {
      flagged = true;
      const geminiReason = `Gemini: ${gemini.explanation}`;
      if (!allReasons.includes(geminiReason)) allReasons.push(geminiReason);
    }

    // ── 6. Record in agent memory ────────────────────────────────────────────
    if (record) {
      const status = flagged ? "blocked" : level === "medium" ? "risky" : "safe";
      recordTransaction(userId, upiId, amount, status);
    }

    // ── 7. Write fraud notification if flagged ───────────────────────────────
    if (flagged) {
      try {
        const notifs = readData<Notification[]>("notifications.json");
        notifs.unshift({
          id: `n_${Date.now()}`,
          userId: "user_ramesh_001",
          type: "alert",
          title: "🚨 Fraud Attempt Detected",
          body: `Payment to ${upiId} blocked — ${gemini.explanation || allReasons[0] || "High risk recipient"}`,
          read: false,
          timestamp: new Date().toISOString(),
        });
        writeData("notifications.json", notifs);
      } catch { /* non-fatal */ }

    }

    // ── 8. QStash event ──────────────────────────────────────────────────────
    publishTransactionEvent({
      id: `risk_${Date.now()}`,
      userId: "user_ramesh_001",
      amount,
      recipientUpi: upiId,
      recipientName: upiId,
      timestamp: new Date().toISOString(),
      riskScore: combinedScore,
      status: flagged ? "blocked" : level,
      trustCheckFlagged: flagged,
      type: "risk-check",
    }).catch(() => {});

    return NextResponse.json(
      {
        riskScore: combinedScore,
        level,
        reasons: allReasons,
        flagged,
        reason: allReasons[0] ?? "No issues detected",
        geminiAnalysis: {
          decision: gemini.finalDecision,
          explanation: gemini.explanation,
          confidence: gemini.confidenceScore,
        },
        _debug: { ruleScore: ruleResult.riskScore, llmScore },
      },
      { headers: cors }
    );
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal error" }, { status: 500, headers: cors });
  }
}
