import { readFile } from "fs/promises";
import path from "path";

export interface Account {
  upiId: string;
  accountNumber: string;
  ifsc: string;
  complaints: number;
  riskScore: number;
}

interface ScamData {
  scamAccounts: Account[];
  safeAccounts: Account[];
}

let cache: ScamData | null = null;

export async function loadScamAccounts(): Promise<ScamData> {
  if (cache) return cache;
  const filePath = path.join(process.cwd(), "data", "scam-accounts.json");
  const raw = await readFile(filePath, "utf-8");
  cache = JSON.parse(raw) as ScamData;
  return cache;
}

export async function findAccountByUpiId(
  upiId: string
): Promise<{ account: Account | null; status: "scam" | "safe" | "unknown" }> {
  const data = await loadScamAccounts();
  const query = upiId.trim().toLowerCase();

  const scam = data.scamAccounts.find((a) => a.upiId.toLowerCase() === query);
  if (scam) return { account: scam, status: "scam" };

  const safe = data.safeAccounts.find((a) => a.upiId.toLowerCase() === query);
  if (safe) return { account: safe, status: "safe" };

  return { account: null, status: "unknown" };
}

export async function getRiskScore(
  upiId: string
): Promise<{ riskScore: number; complaints: number; found: boolean }> {
  const { account } = await findAccountByUpiId(upiId);
  if (!account) return { riskScore: 0, complaints: 0, found: false };
  return { riskScore: account.riskScore, complaints: account.complaints, found: true };
}
