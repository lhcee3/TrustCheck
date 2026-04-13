"use client";

import { useState, useEffect, useRef } from "react";
import { Send, X, Loader2, CheckCircle, AlertTriangle, Shield } from "lucide-react";
import TrustCheckWarning from "./TrustCheckWarning";

interface RiskResult {
  riskScore: number;
  level: "low" | "medium" | "high";
  reasons: string[];
  flagged: boolean;
  reason: string;
}

interface Props {
  onClose: () => void;
  onSuccess: () => void;
  onFraudPrevented: () => void;
}

// Request push notification permission + fire alert
async function firePushAlert(riskScore: number) {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission === "default") {
    await Notification.requestPermission();
  }
  if (Notification.permission === "granted") {
    if ("serviceWorker" in navigator) {
      const reg = await navigator.serviceWorker.ready.catch(() => null);
      if (reg) {
        reg.showNotification("⚠️ Fraud Alert — XpressBank", {
          body: `High-risk transaction detected (score: ${riskScore}/100). Do NOT proceed.`,
          icon: "/warning-icon.png",
          badge: "/warning-icon.png",
          tag: "fraud-alert",
          requireInteraction: true,
        });
        return;
      }
    }
    // Fallback to basic notification
    new Notification("⚠️ Fraud Alert — XpressBank", {
      body: `High-risk transaction detected (score: ${riskScore}/100). Do NOT proceed.`,
    });
  }
}

export default function SendMoneyModal({ onClose, onSuccess, onFraudPrevented }: Props) {
  const [upiId, setUpiId] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [checking, setChecking] = useState(false);
  const [riskResult, setRiskResult] = useState<RiskResult | null>(null);
  const [sending, setSending] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Request notification permission on mount
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // Debounced live risk check on UPI input
  useEffect(() => {
    setRiskResult(null);
    if (!upiId.trim()) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setChecking(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch("/api/risk-score", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ upiId: upiId.trim(), amount: Number(amount) || 0, userId: "default" }),
        });
        const data: RiskResult = await res.json();
        setRiskResult(data);
        // Fire push notification immediately on high risk detection
        if (data.flagged) firePushAlert(data.riskScore);
      } catch {
        setRiskResult(null);
      } finally {
        setChecking(false);
      }
    }, 500);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [upiId, amount]);

  async function runCheck(): Promise<RiskResult | null> {
    try {
      const res = await fetch("/api/risk-score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ upiId: upiId.trim(), amount: Number(amount) || 0, userId: "default" }),
      });
      return await res.json();
    } catch { return null; }
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (checking) return;

    let result = riskResult;
    if (!result) {
      setSending(true);
      result = await runCheck();
      setSending(false);
      if (result) setRiskResult(result);
    }

    if (result?.flagged) {
      firePushAlert(result.riskScore);
      setShowWarning(true);
      return;
    }

    // Record safe transaction
    await fetch("/api/risk-score", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ upiId: upiId.trim(), amount: Number(amount), userId: "default", record: true }),
    }).catch(() => {});

    setSending(true);
    await new Promise((r) => setTimeout(r, 700));
    setSending(false);
    onSuccess();
  }

  const isHighRisk = riskResult?.level === "high";
  const isMedium = riskResult?.level === "medium";
  const score = riskResult?.riskScore ?? 0;
  const barColor = score >= 70 ? "bg-red-500" : score >= 30 ? "bg-amber-500" : "bg-emerald-500";
  const inputBorder = isHighRisk
    ? "border-red-300 bg-red-50 text-red-800"
    : isMedium
    ? "border-amber-300 bg-amber-50 text-slate-800"
    : riskResult
    ? "border-emerald-300 bg-emerald-50 text-slate-800"
    : "border-stone-200 bg-stone-50 text-slate-800 focus:border-[#2D6A4F]";

  if (showWarning && riskResult) {
    return (
      <TrustCheckWarning
        riskScore={riskResult.riskScore}
        level={riskResult.level}
        reasons={riskResult.reasons}
        onCancel={() => {
          // Record as blocked
          fetch("/api/risk-score", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ upiId: upiId.trim(), amount: Number(amount), userId: "default", record: true }),
          }).catch(() => {});
          setShowWarning(false);
          onFraudPrevented();
        }}
        onContinue={() => {
          // Record as risky (user overrode)
          fetch("/api/risk-score", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ upiId: upiId.trim(), amount: Number(amount), userId: "default", record: true }),
          }).catch(() => {});
          setShowWarning(false);
          onSuccess();
        }}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-stone-100 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 bg-[#F7F6F2]">
          <div className="flex items-center gap-2">
            <Send className="w-4 h-4 text-[#2D6A4F]" />
            <h2 className="text-sm font-bold text-slate-800">Send Money</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSend} className="flex flex-col gap-4 p-6">
          {/* UPI input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-500">To (UPI ID / Mobile)</label>
            <div className="relative">
              <input
                type="text"
                placeholder="e.g. friend@okicici"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                required
                className={`w-full rounded-xl border px-4 py-2.5 pr-10 text-sm placeholder-slate-400 focus:outline-none transition-colors ${inputBorder}`}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {checking && <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />}
                {!checking && riskResult && !isHighRisk && !isMedium && <CheckCircle className="w-4 h-4 text-emerald-500" />}
                {!checking && isMedium && <AlertTriangle className="w-4 h-4 text-amber-500" />}
                {!checking && isHighRisk && <AlertTriangle className="w-4 h-4 text-red-500" />}
              </div>
            </div>

            {/* Risk bar */}
            {riskResult && (
              <div className="flex flex-col gap-1 mt-0.5">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Risk Score</span>
                  <span className={`font-bold ${score >= 70 ? "text-red-500" : score >= 30 ? "text-amber-500" : "text-emerald-600"}`}>
                    {score}/100 — {riskResult.level.toUpperCase()}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-stone-100 overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${score}%` }} />
                </div>
              </div>
            )}

            {/* Reasons list */}
            {!checking && riskResult && riskResult.reasons.length > 0 && (isHighRisk || isMedium) && (
              <div className={`rounded-xl border px-3 py-2.5 mt-1 flex flex-col gap-1.5 ${isHighRisk ? "bg-red-50 border-red-200" : "bg-amber-50 border-amber-200"}`}>
                {riskResult.reasons.map((r, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <AlertTriangle className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${isHighRisk ? "text-red-500" : "text-amber-500"}`} />
                    <p className={`text-xs ${isHighRisk ? "text-red-600" : "text-amber-700"}`}>{r}</p>
                  </div>
                ))}
              </div>
            )}
            {!checking && riskResult && !isHighRisk && !isMedium && (
              <p className="text-xs text-emerald-600 flex items-center gap-1 mt-0.5">
                <CheckCircle className="w-3.5 h-3.5" /> Recipient verified — low risk
              </p>
            )}
          </div>

          {/* Amount */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-500">Amount (₹)</label>
            <input
              type="number" placeholder="0.00" value={amount} min={1} required
              onChange={(e) => setAmount(e.target.value)}
              className="rounded-xl border border-stone-200 bg-stone-50 px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#2D6A4F] transition-colors"
            />
          </div>

          {/* Note */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-500">Add a note (optional)</label>
            <input
              type="text" placeholder="e.g. Rent payment" value={note}
              onChange={(e) => setNote(e.target.value)}
              className="rounded-xl border border-stone-200 bg-stone-50 px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#2D6A4F] transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-2.5">
            <Shield className="w-4 h-4 text-[#2D6A4F] shrink-0" />
            <p className="text-xs text-[#2D6A4F]">AI-powered fraud detection on every transaction</p>
          </div>

          <button
            type="submit"
            disabled={sending || checking}
            className={`rounded-xl transition-colors py-2.5 text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-60 ${
              isHighRisk ? "bg-red-500 hover:bg-red-600" :
              isMedium ? "bg-amber-500 hover:bg-amber-600" :
              "bg-[#2D6A4F] hover:bg-[#245a42]"
            }`}
          >
            {sending ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</> :
             checking ? <><Loader2 className="w-4 h-4 animate-spin" /> Analysing...</> :
             isHighRisk ? <><AlertTriangle className="w-4 h-4" /> High Risk — Review Warning</> :
             isMedium ? <><AlertTriangle className="w-4 h-4" /> Send with Caution</> :
             <><Send className="w-4 h-4" /> Send Money</>}
          </button>
        </form>
      </div>
    </div>
  );
}
