import { NextRequest, NextResponse } from "next/server";
import { findAccountByUpiId } from "@/lib/mockData";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { upiId, amount } = body as { upiId?: string; amount?: number };

    if (!upiId || typeof upiId !== "string") {
      return NextResponse.json(
        { error: "upiId is required" },
        { status: 400, headers: corsHeaders }
      );
    }

    const { account, status } = await findAccountByUpiId(upiId);

    if (status === "scam" && account) {
      return NextResponse.json(
        {
          flagged: true,
          riskScore: account.riskScore,
          reason: `This account has ${account.complaints} fraud complaints`,
        },
        { headers: corsHeaders }
      );
    }

    return NextResponse.json(
      {
        flagged: false,
        riskScore: 0,
        reason: "No complaints found for this account",
      },
      { headers: corsHeaders }
    );
  } catch {
    return NextResponse.json(
      { error: "Invalid request" },
      { status: 500, headers: corsHeaders }
    );
  }
}
