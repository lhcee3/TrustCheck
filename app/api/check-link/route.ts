import { NextRequest, NextResponse } from "next/server";
import { checkOpenPhish } from "@/lib/openphish";
import { checkPhishTank } from "@/lib/phishtank";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error("timeout")), ms)
    ),
  ]);
}

function getRecommendation(riskScore: number): string {
  if (riskScore > 70) return "HOLD";
  if (riskScore >= 30) return "CONFIRM";
  return "ALLOW";
}

async function handleRequest(url: string | null) {
  if (!url) {
    return NextResponse.json(
      { error: "url is required" },
      { status: 400, headers: corsHeaders }
    );
  }

  try {
    const [openphishResult, phishtankResult] = await Promise.all([
      withTimeout(checkOpenPhish(url), 5000),
      withTimeout(checkPhishTank(url), 5000),
    ]);

    const flaggedCount = [openphishResult.isPhishing, phishtankResult.isPhishing].filter(Boolean).length;
    const riskScore = flaggedCount === 2 ? 95 : flaggedCount === 1 ? 75 : 10;

    return NextResponse.json(
      {
        url,
        riskScore,
        sources: {
          openphish: openphishResult.isPhishing,
          phishtank: phishtankResult.isPhishing,
        },
        recommendation: getRecommendation(riskScore),
      },
      { headers: corsHeaders }
    );
  } catch {
    return NextResponse.json(
      { error: "Failed to check URL" },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  return handleRequest(url);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    return handleRequest(body?.url ?? null);
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400, headers: corsHeaders }
    );
  }
}
