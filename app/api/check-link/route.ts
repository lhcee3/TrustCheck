import { NextRequest, NextResponse } from "next/server";
import { checkOpenPhish } from "@/lib/openphish";
import { checkUrlWithGoogleSafeBrowsing } from "@/lib/googleSafeBrowsing/checkUrl";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function getRecommendation(riskScore: number): string {
  if (riskScore > 70) return "HOLD";
  if (riskScore >= 30) return "CONFIRM";
  return "ALLOW";
}

async function handleRequest(url: string | null) {
  if (!url) {
    return NextResponse.json({ error: "url is required" }, { status: 400, headers: corsHeaders });
  }

  try {
    const [openphishResult, googleResult] = await Promise.all([
      checkOpenPhish(url).catch(() => ({ isPhishing: false, source: "OpenPhish" as const })),
      checkUrlWithGoogleSafeBrowsing(url).catch(() => null),
    ]);

    const googleFlagged = googleResult?.isMalicious ?? false;
    const openphishFlagged = openphishResult.isPhishing;

    // Google Safe Browsing is authoritative — instant high score
    let riskScore = 10;
    if (googleFlagged) riskScore = 95;
    else if (openphishFlagged) riskScore = 75;

    return NextResponse.json(
      {
        url,
        riskScore,
        sources: {
          googleSafeBrowsing: googleFlagged,
          threats: googleResult?.threats ?? [],
          openphish: openphishFlagged,
        },
        recommendation: getRecommendation(riskScore),
      },
      { headers: corsHeaders }
    );
  } catch {
    return NextResponse.json({ error: "Failed to check URL" }, { status: 500, headers: corsHeaders });
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET(req: NextRequest) {
  return handleRequest(req.nextUrl.searchParams.get("url"));
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    return handleRequest(body?.url ?? null);
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400, headers: corsHeaders });
  }
}
