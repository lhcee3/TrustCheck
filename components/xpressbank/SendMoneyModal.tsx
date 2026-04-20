"use client";

import { useState, useEffect, useRef } from "react";
import { Send, X, Loader2, CheckCircle, AlertTriangle, Shield } from "lucide-react";
import TrustCheckWarning from "./TrustCheckWarning";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/formatters";

interface Props {
  onClose: () => void;
  onSuccess: (newBalance?: number) => void;
  onFraudPrevented: () => void;
  prefillUpi?: string;
  prefillName?: string;
}

interface RiskResult { riskScore: number; level: string; reasons: string[]; flagged: boolean; reason: string; }

async function firePushAlert(riskScore: number) {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission === "default") await Notification.requestPermission();
  if (Notification.permission === "granted") {
    const reg = await navigator.serviceWorker?.ready.catch(() => null);
    if (reg) {
      reg.showNotification("⚠️ Fraud Alert — XpressBank", {
        body: `High-risk transaction detected (score: ${riskScore}/100). Do NOT proceed.`,
        icon: "/icon-192.png", tag: "fraud-alert", requireInteraction: true,
      });
    }
  }
}

const SESSION_KEY = "xb_session_txns";

function saveToSession(tx: Record<string, unknown>) {
  try {
    const existing = JSON.parse(sessionStorage.getItem(SESSION_KEY) ?? "[]") as Record<string, unknown>[];
    existing.unshift(tx);
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(existing.slice(0, 100)));
  } catch { /* ignore */ }
}

export default function SendMoneyModal({ onClose, onSuccess, onFraudPrevented, prefillUpi = "", prefillName = "" }: Props) {
  const [upiId, setUpiId] = useState(prefillUpi);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [checking, setChecking] = useState(false);
  const [riskResult, setRiskResult] = useState<RiskResult | null>(null);
  const [sending, setSending] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [error, setError] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    setRiskResult(null);
    setError("");
    if (!upiId.trim()) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setChecking(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const data = await api.getRiskScore({ upiId: upiId.trim(), amount: Number(amount) || 0, userId: "user_ramesh_001" });
        setRiskResult(data);
        if (data.flagged) firePushAlert(data.riskScore);
      } catch { setRiskResult(null); }
      finally { setChecking(false); }
    }, 500);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [upiId, amount]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    // Check balance before API call
    const stored = localStorage.getItem("xb_user");
    if (stored) {
      const u = JSON.parse(stored);
      if (Number(amount) > u.balance) { setError("Insufficient balance"); return; }
    }

    if (checking) return;

    let result = riskResult;
    if (!result && upiId.trim()) {
      setSending(true);
      try { result = await api.getRiskScore({ upiId: upiId.trim(), amount: Number(amount), userId: "user_ramesh_001" }); setRiskResult(result); }
      catch { setSending(false); setError("Could not verify recipient. Try again."); return; }
      setSending(false);
    }

    if (result?.flagged) {
      firePushAlert(result.riskScore);
      // Save blocked attempt to session so it shows in statements
      saveToSession({
        id: `blocked_${Date.now()}`,
        userId: "user_ramesh_001",
        type: "sent",
        amount: Number(amount),
        recipientName: prefillName || upiId.trim(),
        recipientUpi: upiId.trim(),
        senderName: "Ramesh Kumar",
        senderUpi: "ramesh@xpressbank",
        note,
        category: "transfer",
        timestamp: new Date().toISOString(),
        status: "blocked",
        riskScore: result.riskScore,
        trustCheckFlagged: true,
      });
      setShowWarning(true);
      return;
    }

    await doSend(result?.riskScore ?? 0, result?.flagged ?? false);
  }

  async function doSend(riskScore: number, trustCheckFlagged: boolean) {
    setSending(true);
    try {
      const res = await api.createTransaction({
        recipientUpi: upiId.trim(),
        recipientName: prefillName || upiId.trim(),
        amount: Number(amount),
        note,
        category: "transfer",
        riskScore,
        trustCheckFlagged,
      });
      // Save to session so statements tab shows it immediately
      saveToSession({
        id: res.transaction.id,
        userId: "user_ramesh_001",
        type: "sent",
        amount: Number(amount),
        recipientName: prefillName || upiId.trim(),
        recipientUpi: upiId.trim(),
        senderName: "Ramesh Kumar",
        senderUpi: "ramesh@xpressbank",
        note,
        category: "transfer",
        timestamp: res.transaction.timestamp,
        status: "success",
        riskScore,
        trustCheckFlagged,
      });
      onSuccess(res.newBalance);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Transaction failed";
      setError(msg.includes("Insufficient") ? "Insufficient balance" : "Transaction failed. Try again.");
    } finally { setSending(false); }
  }

  const isHigh = riskResult?.level === "high";
  const isMedium = riskResult?.level === "medium";
  const score = riskResult?.riskScore ?? 0;
  const barColor = score >= 70 ? "bg-red-500" : score >= 30 ? "bg-amber-500" : "bg-emerald-500";

  if (showWarning && riskResult) {
    return (
      <TrustCheckWarning
        riskScore={riskResult.riskScore}
        level={riskResult.level as "low" | "medium" | "high"}
        reasons={riskResult.reasons}
        onCancel={() => { setShowWarning(false); onFraudPrevented(); }}
        onContinue={() => { setShowWarning(false); doSend(riskResult.riskScore, true); }}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-stone-100 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 bg-[#F7F6F2]">
          <div className="flex items-center gap-2"><Send className="w-4 h-4 text-[#2D6A4F]" /><h2 className="text-sm font-bold text-slate-800">Send Money</h2></div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors"><X className="w-4 h-4" /></button>
        </div>

        <form onSubmit={handleSend} className="flex flex-col gap-4 p-6">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-500">To (UPI ID / Mobile)</label>
            <div className="relative">
              <input type="text" placeholder="e.g. friend@okicici" value={upiId} onChange={(e) => setUpiId(e.target.value)} required
                className={`w-full rounded-xl border px-4 py-2.5 pr-10 text-sm placeholder-slate-400 focus:outline-none transition-colors ${isHigh ? "border-red-300 bg-red-50 text-red-800" : isMedium ? "border-amber-300 bg-amber-50 text-slate-800" : riskResult ? "border-emerald-300 bg-emerald-50 text-slate-800" : "border-stone-200 bg-stone-50 text-slate-800 focus:border-[#2D6A4F]"}`}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {checking && <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />}
                {!checking && riskResult && !isHigh && !isMedium && <CheckCircle className="w-4 h-4 text-emerald-500" />}
                {!checking && (isHigh || isMedium) && <AlertTriangle className={`w-4 h-4 ${isHigh ? "text-red-500" : "text-amber-500"}`} />}
              </div>
            </div>
            {riskResult && (
              <div className="flex flex-col gap-1 mt-0.5">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Risk Score</span>
                  <span className={`font-bold ${score >= 70 ? "text-red-500" : score >= 30 ? "text-amber-500" : "text-emerald-600"}`}>{score}/100 — {riskResult.level.toUpperCase()}</span>
                </div>
                <div className="h-2 rounded-full bg-stone-100 overflow-hidden"><div className={`h-full rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${score}%` }} /></div>
              </div>
            )}
            {!checking && (isHigh || isMedium) && riskResult?.reasons.map((r, i) => (
              <div key={i} className={`flex items-start gap-2 rounded-xl border px-3 py-2.5 mt-1 ${isHigh ? "bg-red-50 border-red-200" : "bg-amber-50 border-amber-200"}`}>
                <AlertTriangle className={`w-4 h-4 shrink-0 mt-0.5 ${isHigh ? "text-red-500" : "text-amber-500"}`} />
                <p className={`text-xs ${isHigh ? "text-red-600" : "text-amber-700"}`}>{r}</p>
              </div>
            ))}
            {!checking && riskResult && !isHigh && !isMedium && (
              <p className="text-xs text-emerald-600 flex items-center gap-1 mt-0.5"><CheckCircle className="w-3.5 h-3.5" /> Recipient verified — low risk</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-500">Amount (₹)</label>
            <input type="number" placeholder="0.00" value={amount} min={1} required onChange={(e) => setAmount(e.target.value)}
              className="rounded-xl border border-stone-200 bg-stone-50 px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#2D6A4F] transition-colors"
            />
            {amount && Number(amount) > 0 && <p className="text-xs text-slate-400">{formatCurrency(Number(amount))}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-500">Add a note (optional)</label>
            <input type="text" placeholder="e.g. Rent payment" value={note} onChange={(e) => setNote(e.target.value)}
              className="rounded-xl border border-stone-200 bg-stone-50 px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#2D6A4F] transition-colors"
            />
          </div>

          {error && <p className="text-xs text-red-500 text-center">{error}</p>}

          <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-2.5">
            <Shield className="w-4 h-4 text-[#2D6A4F] shrink-0" />
            <p className="text-xs text-[#2D6A4F]">AI-powered fraud detection on every transaction</p>
          </div>

          <button type="submit" disabled={sending || checking}
            className={`rounded-xl transition-colors py-2.5 text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-60 ${isHigh ? "bg-red-500 hover:bg-red-600" : isMedium ? "bg-amber-500 hover:bg-amber-600" : "bg-[#2D6A4F] hover:bg-[#245a42]"}`}
          >
            {sending ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</> :
             checking ? <><Loader2 className="w-4 h-4 animate-spin" /> Verifying...</> :
             isHigh ? <><AlertTriangle className="w-4 h-4" /> High Risk — Review Warning</> :
             isMedium ? <><AlertTriangle className="w-4 h-4" /> Send with Caution</> :
             <><Send className="w-4 h-4" /> Send Money</>}
          </button>
        </form>
      </div>
    </div>
  );
}
