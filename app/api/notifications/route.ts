import { NextRequest, NextResponse } from "next/server";
import { readData, writeData } from "@/lib/dataStore";

interface Notification { id: string; userId: string; read: boolean; timestamp: string; [key: string]: unknown; }

export async function GET() {
  const notifs = readData<Notification[]>("notifications.json")
    .filter((n) => n.userId === "user_ramesh_001")
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  return NextResponse.json(notifs);
}

export async function PATCH(req: NextRequest) {
  const { markAllRead } = await req.json();
  if (!markAllRead) return NextResponse.json({ error: "Invalid" }, { status: 400 });
  const notifs = readData<Notification[]>("notifications.json");
  notifs.forEach((n) => { if (n.userId === "user_ramesh_001") n.read = true; });
  writeData("notifications.json", notifs);
  return NextResponse.json(notifs.filter((n) => n.userId === "user_ramesh_001"));
}
