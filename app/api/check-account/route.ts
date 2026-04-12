import { NextRequest, NextResponse } from "next/server";
import { findAccountByUpiId } from "@/lib/mockData";

async function handleRequest(upiId: string | null) {
  if (!upiId) {
    return NextResponse.json({ error: "upiId is required" }, { status: 400 });
  }

  const { found, isScam, riskScore, complaints } = await findAccountByUpiId(upiId);

  if (found && isScam) {
    return NextResponse.json({ found: true, riskScore, complaints, recommendation: "HOLD" });
  }

  return NextResponse.json({ found, riskScore: 0, complaints: 0, recommendation: "ALLOW" });
}

export async function GET(req: NextRequest) {
  const upiId = req.nextUrl.searchParams.get("upiId");
  return handleRequest(upiId);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  return handleRequest(body.upiId ?? null);
}
