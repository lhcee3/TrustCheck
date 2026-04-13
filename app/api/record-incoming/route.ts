import { NextRequest, NextResponse } from "next/server";
import { recordIncoming } from "@/lib/trustcheckAgent";

export async function POST(req: NextRequest) {
  const { userId = "default", sender, amount } = await req.json();
  if (!sender) return NextResponse.json({ error: "sender required" }, { status: 400 });
  recordIncoming(userId, sender, amount ?? 0);
  return NextResponse.json({ ok: true });
}
