import { NextRequest, NextResponse } from "next/server";
import { readData, writeData } from "@/lib/dataStore";

interface Transaction { id: string; status: string; [key: string]: unknown; }

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const txns = readData<Transaction[]>("transactions.json");
  const txn = txns.find((t) => t.id === id);
  if (!txn) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(txn);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { status } = await req.json();
  const txns = readData<Transaction[]>("transactions.json");
  const idx = txns.findIndex((t) => t.id === id);
  if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });
  txns[idx].status = status;
  writeData("transactions.json", txns);
  return NextResponse.json(txns[idx]);
}
