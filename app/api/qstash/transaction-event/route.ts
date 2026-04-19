import { NextRequest, NextResponse } from "next/server";
import { readData, writeData } from "@/lib/dataStore";

interface TransactionEvent {
  id: string; userId: string; amount: number; recipientUpi: string;
  recipientName: string; status: string; riskScore: number;
  trustCheckFlagged: boolean; timestamp: string; type: string;
}

async function processEvent(req: NextRequest): Promise<Response> {
  try {
    const event = await req.json() as TransactionEvent;

    let events: TransactionEvent[] = [];
    try { events = readData<TransactionEvent[]>("events.json"); } catch { events = []; }

    events.unshift({ ...event, timestamp: event.timestamp ?? new Date().toISOString() });
    if (events.length > 200) events = events.slice(0, 200);
    writeData("events.json", events);

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[QStash consumer] Error:", e);
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest): Promise<Response> {
  const currentKey = process.env.QSTASH_CURRENT_SIGNING_KEY;
  const nextKey = process.env.QSTASH_NEXT_SIGNING_KEY;

  if (currentKey && nextKey) {
    try {
      const { verifySignatureAppRouter } = await import("@upstash/qstash/nextjs");
      return verifySignatureAppRouter(processEvent)(req) as Promise<Response>;
    } catch (e) {
      console.error("[QStash] Signature verification failed:", e);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  return processEvent(req);
}
