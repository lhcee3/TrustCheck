import { NextRequest, NextResponse } from "next/server";
import { readData } from "@/lib/dataStore";

interface User {
  id: string; name: string; email: string; passwordHash: string;
  upiId: string; accountNumber: string; balance: number; avatarInitials: string;
  phone: string; ifsc: string; branch: string; accountType: string;
  joinedDate: string; kycStatus: string; linkedCards: unknown[];
}

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    const users = readData<User[]>("users.json");
    const user = users.find((u) => u.email === email && u.passwordHash === password);
    if (!user) {
      return NextResponse.json({ success: false, error: "Invalid credentials" }, { status: 401 });
    }
    const { passwordHash: _, ...safe } = user;
    return NextResponse.json({ success: true, user: safe });
  } catch {
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
