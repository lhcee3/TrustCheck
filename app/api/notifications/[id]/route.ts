import { NextRequest, NextResponse } from "next/server";
import { readData, writeData } from "@/lib/dataStore";

interface Notification { id: string; read: boolean; [key: string]: unknown; }

export async function PATCH(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const notifs = readData<Notification[]>("notifications.json");
  const idx = notifs.findIndex((n) => n.id === id);
  if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });
  notifs[idx].read = true;
  writeData("notifications.json", notifs);
  return NextResponse.json(notifs[idx]);
}
