import { NextRequest, NextResponse } from "next/server";
import { recordIncoming } from "@/lib/trustcheckAgent";
import { readData, writeData } from "@/lib/dataStore";

interface Transaction { id: string; userId: string; type: string; amount: number; recipientName: string; recipientUpi: string; senderName: string; senderUpi: string; note: string; category: string; timestamp: string; status: string; riskScore: number; trustCheckFlagged: boolean; }
interface User { id: string; balance: number; name: string; upiId: string; [key: string]: unknown; }

export async function POST(req: NextRequest) {
  const { userId = "default", sender, amount = 0, senderName = sender } = await req.json();
  if (!sender) return NextResponse.json({ error: "sender required" }, { status: 400 });

  recordIncoming(userId, sender, amount);

  // Write received transaction to JSON
  try {
    const users = readData<User[]>("users.json");
    const userIdx = users.findIndex((u) => u.id === "user_ramesh_001");

    const newTxn: Transaction = {
      id: `txn_${Date.now()}`,
      userId: "user_ramesh_001",
      type: "received",
      amount,
      recipientName: userIdx !== -1 ? users[userIdx].name as string : "Ramesh Kumar",
      recipientUpi: userIdx !== -1 ? users[userIdx].upiId as string : "ramesh@xpressbank",
      senderName: senderName || sender,
      senderUpi: sender,
      note: "Incoming payment",
      category: "transfer",
      timestamp: new Date().toISOString(),
      status: "success",
      riskScore: 0,
      trustCheckFlagged: false,
    };

    if (userIdx !== -1) {
      users[userIdx].balance = Math.round((users[userIdx].balance + amount) * 100) / 100;
      writeData("users.json", users);
    }

    const txns = readData<Transaction[]>("transactions.json");
    txns.unshift(newTxn);
    writeData("transactions.json", txns);
  } catch { /* non-fatal */ }

  return NextResponse.json({ ok: true });
}
