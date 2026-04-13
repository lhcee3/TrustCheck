import { NextRequest, NextResponse } from "next/server";
import { findAccountByUpiId } from "@/lib/mockData";
import { analyzeTransaction, recordTransaction } from "@/lib/trustcheckAgent";

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
      upiId?: string;
      amount?: number;
      userId?: string;
      record?: boolean;
    };

    if (!upiId || typeof upiId !== "string") {
      return NextResponse.json({ error: "upiId is required" }, { status: 400, headers: cors });
    }

    // Fetch recipient data from DB
    const { found, isScam, riskScore: dbScore, complaints } = await findAccountByUpiId(upiId);

    // Run behavioral analysis
    const result = analyzeTransaction({
      userId,
      upiId,
      amount,
      recipientRiskScore: isScam ? dbScore : 0,
      recipientComplaints: complaints,
      recipientFound: found && isScam,
    });

    // Optionally record the transaction (called after user confirms)
    if (record) {
      const status = result.level === "high" ? "blocked" : result.level === "medium" ? "risky" : "safe";
      recordTransaction(userId, upiId, amount, status);
    }

    return NextResponse.json(
      {
        riskScore: result.riskScore,
        level: result.level,
        reasons: result.reasons,
        flagged: result.flagged,
        // Legacy compat
        reason: result.reasons[0] ?? "No issues detected",
      },
      { headers: cors }
    );
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Internal error" }, { status: 500, headers: cors });
  }
}
