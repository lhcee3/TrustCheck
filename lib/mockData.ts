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

// In-memory cache
let cache: ScamData | null = null;

async function loadScamAccounts(): Promise<ScamData> {
  if (cache) return cache;
  const filePath = path.join(process.cwd(), "data", "scam-accounts.json");
  const raw = await readFile(filePath, "utf-8");
  cache = JSON.parse(raw) as ScamData;
  return cache;
}

export async function findAccountByUpiId(
  upiId: string
): Promise<{ found: boolean; isScam: boolean; riskScore: number; complaints: number }> {
  const data = await loadScamAccounts();
  const query = upiId.trim().toLowerCase();

  const scam = data.scamAccounts.find((a) => a.upiId.toLowerCase() === query);
  if (scam) {
    return { found: true, isScam: true, riskScore: scam.riskScore, complaints: scam.complaints };
  }

  const safe = data.safeAccounts.find((a) => a.upiId.toLowerCase() === query);
  if (safe) {
    return { found: true, isScam: false, riskScore: 0, complaints: 0 };
  }

  return { found: false, isScam: false, riskScore: 0, complaints: 0 };
}

export async function getRiskScore(
  upiId: string
): Promise<{ riskScore: number; complaints: number; found: boolean }> {
  const { found, riskScore, complaints } = await findAccountByUpiId(upiId);
  return { riskScore, complaints, found };
}
