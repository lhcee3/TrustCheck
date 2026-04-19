import { NextRequest, NextResponse } from "next/server";
import { readData, writeData } from "@/lib/dataStore";
import { publishTransactionEvent } from "@/lib/qstash/producer";

interface Transaction {
  id: string; userId: string; type: string; amount: number;
  recipientName: string; recipientUpi: string; senderName: string; senderUpi: string;
  note: string; category: string; timestamp: string; status: string;
  riskScore: number; trustCheckFlagged: boolean;
}
interface User { id: string; balance: number; name: string; upiId: string; [key: string]: unknown; }

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const type = searchParams.get("type");
    const search = searchParams.get("search")?.toLowerCase();
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined;

    let txns = readData<Transaction[]>("transactions.json")
      .filter((t) => t.userId === "user_ramesh_001")
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    if (type && type !== "all") txns = txns.filter((t) => t.type === type);
    if (search) txns = txns.filter((t) =>
      t.recipientName.toLowerCase().includes(search) ||
      t.senderName.toLowerCase().includes(search) ||
      t.recipientUpi.toLowerCase().includes(search) ||
      t.note.toLowerCase().includes(search)
    );
    if (limit) txns = txns.slice(0, limit);

    return NextResponse.json(txns);
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { recipientUpi, recipientName, amount, note, category, riskScore = 0, trustCheckFlagged = false } = body;

    const users = readData<User[]>("users.json");
    const userIdx = users.findIndex((u) => u.id === "user_ramesh_001");
    if (userIdx === -1) return NextResponse.json({ error: "User not found" }, { status: 404 });

    if (users[userIdx].balance < amount) {
      return NextResponse.json({ error: "Insufficient balance" }, { status: 400 });
    }

    const newTxn: Transaction = {
      id: `txn_${Date.now()}`,
      userId: "user_ramesh_001",
      type: "sent",
      amount,
      recipientName: recipientName || recipientUpi,
      recipientUpi,
      senderName: users[userIdx].name as string,
      senderUpi: users[userIdx].upiId as string,
      note: note || "",
      category: category || "transfer",
      timestamp: new Date().toISOString(),
      status: "success",
      riskScore,
      trustCheckFlagged,
    };

    users[userIdx].balance = Math.round((users[userIdx].balance - amount) * 100) / 100;
    writeData("users.json", users);

    const txns = readData<Transaction[]>("transactions.json");
    txns.unshift(newTxn);
    writeData("transactions.json", txns);

    publishTransactionEvent({
      id: newTxn.id,
      userId: "user_ramesh_001",
      amount,
      recipientUpi,
      recipientName: newTxn.recipientName,
      status: "success",
      riskScore,
      trustCheckFlagged,
      timestamp: newTxn.timestamp,
      type: "sent",
    }).catch(() => {});

    return NextResponse.json({ transaction: newTxn, newBalance: users[userIdx].balance }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
