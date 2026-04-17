import { NextRequest, NextResponse } from "next/server";
import { readData, writeData } from "@/lib/dataStore";

interface Contact { id: string; lastPaid: string | null; totalPaid: number; [key: string]: unknown; }

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const contacts = readData<Contact[]>("contacts.json");
  const filtered = contacts.filter((c) => c.id !== id);
  writeData("contacts.json", filtered);
  return NextResponse.json({ success: true });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { lastPaid, amount } = await req.json();
  const contacts = readData<Contact[]>("contacts.json");
  const idx = contacts.findIndex((c) => c.id === id);
  if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (lastPaid) contacts[idx].lastPaid = lastPaid;
  if (amount) contacts[idx].totalPaid = (contacts[idx].totalPaid as number) + amount;
  writeData("contacts.json", contacts);
  return NextResponse.json(contacts[idx]);
}
