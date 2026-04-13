// TrustCheck Agent — lightweight rule-based risk engine (<100ms)

export interface RiskResult {
  riskScore: number;
  level: "low" | "medium" | "high";
  reasons: string[];
  flagged: boolean;
}

interface IncomingTx {
  sender: string;
  amount: number;
  timestamp: number;
}

interface UserProfile {
  avgAmount: number;
  txCount: number;
  knownRecipients: string[];
  lastIncoming: IncomingTx | null;
  txHistory: { upiId: string; amount: number; timestamp: number; status: "safe" | "risky" | "blocked" }[];
}

// In-memory store (resets on server restart — fine for demo)
const userProfiles = new Map<string, UserProfile>();

function getProfile(userId: string): UserProfile {
  if (!userProfiles.has(userId)) {
    userProfiles.set(userId, {
      avgAmount: 2000,
      txCount: 0,
      knownRecipients: ["kiran@okhdfc", "billing@paytm", "rahul@okicici", "amazon@apl", "corp@hdfcbank"],
      lastIncoming: null,
      txHistory: [],
    });
  }
  return userProfiles.get(userId)!;
}

// Suspicious keywords in UPI IDs
const SUSPICIOUS_KEYWORDS = ["refund", "kyc", "verify", "update", "alert", "helpdesk", "support", "reward", "prize", "lottery", "loan", "credit", "cashback", "cbi", "police", "rbi", "income", "tax", "customs", "parcel", "arrest"];

export function analyzeTransaction(params: {
  userId: string;
  upiId: string;
  amount: number;
  recipientRiskScore?: number;
  recipientComplaints?: number;
  recipientFound?: boolean;
}): RiskResult {
  const { userId, upiId, amount, recipientRiskScore = 0, recipientComplaints = 0, recipientFound = false } = params;
  const profile = getProfile(userId);
  const reasons: string[] = [];
  let score = 0;

  // ── 1. Recipient risk (from scam DB) ──────────────────────────────────────
  if (recipientFound && recipientRiskScore > 0) {
    score += 50;
    reasons.push(`Recipient flagged in fraud database`);
    if (recipientComplaints > 10) {
      score += 20;
      reasons.push(`${recipientComplaints} fraud complaints on record`);
    }
  }

  // ── 2. Suspicious UPI keyword ─────────────────────────────────────────────
  const upiLower = upiId.toLowerCase();
  const matchedKeyword = SUSPICIOUS_KEYWORDS.find((k) => upiLower.includes(k));
  if (matchedKeyword) {
    score += 10;
    reasons.push(`UPI ID contains suspicious keyword: "${matchedKeyword}"`);
  }

  // ── 3. First-time recipient ───────────────────────────────────────────────
  const isKnown = profile.knownRecipients.some((r) => r.toLowerCase() === upiLower);
  if (!isKnown) {
    score += 20;
    reasons.push("First-time transaction to this recipient");
  }

  // ── 4. Unusually large amount ─────────────────────────────────────────────
  if (profile.avgAmount > 0 && amount > profile.avgAmount * 2) {
    score += 20;
    reasons.push(`Amount ₹${amount.toLocaleString("en-IN")} is unusually high (avg: ₹${profile.avgAmount.toLocaleString("en-IN")})`);
  }

  // ── 5. Odd hours (12AM–5AM IST) ───────────────────────────────────────────
  const hourIST = (new Date().getUTCHours() + 5) % 24 + (new Date().getUTCMinutes() >= 30 ? 0 : 0);
  const utcHour = new Date().getUTCHours();
  // IST = UTC+5:30, midnight-5AM IST = 18:30-23:30 UTC
  if (utcHour >= 18 || utcHour < 0) {
    score += 10;
    reasons.push("Transaction attempted during unusual hours (late night)");
  }

  // ── 6. Wrong-payment / refund scam pattern ────────────────────────────────
  if (profile.lastIncoming) {
    const minsAgo = (Date.now() - profile.lastIncoming.timestamp) / 60000;
    if (minsAgo <= 30 && profile.lastIncoming.sender.toLowerCase() !== upiLower) {
      score += 40;
      reasons.push(`Suspicious refund pattern — received money from ${profile.lastIncoming.sender} ${Math.round(minsAgo)}m ago, now sending to different UPI`);
    }
  }

  // ── Cap at 100 ────────────────────────────────────────────────────────────
  score = Math.min(score, 100);

  const level: RiskResult["level"] = score >= 70 ? "high" : score >= 30 ? "medium" : "low";

  return {
    riskScore: score,
    level,
    reasons,
    flagged: level === "high",
  };
}

export function recordIncoming(userId: string, sender: string, amount: number) {
  const profile = getProfile(userId);
  profile.lastIncoming = { sender, amount, timestamp: Date.now() };
}

export function recordTransaction(
  userId: string,
  upiId: string,
  amount: number,
  status: "safe" | "risky" | "blocked"
) {
  const profile = getProfile(userId);

  // Update avg amount
  profile.txCount += 1;
  profile.avgAmount = Math.round(
    (profile.avgAmount * (profile.txCount - 1) + amount) / profile.txCount
  );

  // Add to known recipients if safe
  if (status === "safe" && !profile.knownRecipients.includes(upiId.toLowerCase())) {
    profile.knownRecipients.push(upiId.toLowerCase());
  }

  profile.txHistory.unshift({ upiId, amount, timestamp: Date.now(), status });
  if (profile.txHistory.length > 50) profile.txHistory.pop();
}

export function getProfile_public(userId: string) {
  return getProfile(userId);
}
