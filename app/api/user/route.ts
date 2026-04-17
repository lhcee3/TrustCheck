import { NextRequest, NextResponse } from "next/server";
import { readData, writeData } from "@/lib/dataStore";

interface User { id: string; passwordHash: string; name: string; phone: string; balance: number; [key: string]: unknown; }

export async function GET() {
  try {
    const users = readData<User[]>("users.json");
    const user = users.find((u) => u.id === "user_ramesh_001");
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
    const { passwordHash: _, ...safe } = user;
    return NextResponse.json(safe);
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const users = readData<User[]>("users.json");
    const idx = users.findIndex((u) => u.id === "user_ramesh_001");
    if (idx === -1) return NextResponse.json({ error: "User not found" }, { status: 404 });
    const allowed = ["balance", "phone", "name"];
    for (const key of allowed) {
      if (body[key] !== undefined) users[idx][key] = body[key];
    }
    writeData("users.json", users);
    const { passwordHash: _, ...safe } = users[idx];
    return NextResponse.json(safe);
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
