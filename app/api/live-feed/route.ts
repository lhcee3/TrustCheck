import { NextResponse } from "next/server";
import { readData } from "@/lib/dataStore";

interface TransactionEvent {
  id: string; userId: string; type: string; amount: number;
  recipientName: string; recipientUpi: string;
  senderName: string; senderUpi: string;
  timestamp: string; status: string; riskScore: number;
  trustCheckFlagged: boolean;
  [key: string]: unknown;
}

export const dynamic = "force-dynamic";

function readLatest(): TransactionEvent[] {
  // Try events.json first (populated by QStash in production)
  try {
    const events = readData<TransactionEvent[]>("events.json");
    if (events.length > 0) return events;
  } catch { /* fall through */ }

  // Always works locally — read directly from transactions.json
  try {
    return readData<TransactionEvent[]>("transactions.json")
      .filter((t) => t.userId === "user_ramesh_001")
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  } catch { return []; }
}

export async function GET() {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Send initial snapshot immediately
      const initial = readLatest().slice(0, 20);
      let lastTimestamp = initial.length > 0 ? initial[0].timestamp : new Date(0).toISOString();

      controller.enqueue(encoder.encode(
        `data: ${JSON.stringify({ type: "snapshot", transactions: initial })}\n\n`
      ));

      // Poll every 2s — only send genuinely new entries
      const interval = setInterval(() => {
        try {
          const all = readLatest();
          const newEvents = all.filter((e) => new Date(e.timestamp) > new Date(lastTimestamp));
          if (newEvents.length > 0) {
            lastTimestamp = newEvents[0].timestamp;
            controller.enqueue(encoder.encode(
              `data: ${JSON.stringify({ type: "new", transactions: newEvents })}\n\n`
            ));
          }
        } catch { /* ignore */ }
      }, 2000);

      // Close after 5 min (Vercel serverless limit)
      setTimeout(() => { clearInterval(interval); controller.close(); }, 290000);
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
