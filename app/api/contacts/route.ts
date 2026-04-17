import { NextRequest, NextResponse } from "next/server";
import { readData, writeData } from "@/lib/dataStore";
import { getInitials } from "@/lib/formatters";

interface Contact { id: string; userId: string; name: string; upiId: string; bank: string; avatarInitials: string; lastPaid: string | null; totalPaid: number; }

export async function GET() {
  const contacts = readData<Contact[]>("contacts.json").filter((c) => c.userId === "user_ramesh_001");
  return NextResponse.json(contacts);
}

export async function POST(req: NextRequest) {
  const { name, upiId, bank } = await req.json();
  const contacts = readData<Contact[]>("contacts.json");
  const newContact: Contact = {
    id: `c_${Date.now()}`,
    userId: "user_ramesh_001",
    name,
    upiId,
    bank: bank || "",
    avatarInitials: getInitials(name),
    lastPaid: null,
    totalPaid: 0,
  };
  contacts.push(newContact);
  writeData("contacts.json", contacts);
  return NextResponse.json(newContact, { status: 201 });
}
