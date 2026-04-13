"use client";

import { useState, useEffect, useRef } from "react";
import { Send, X, Loader2, CheckCircle, AlertTriangle, Shield } from "lucide-react";
import TrustCheckWarning from "./TrustCheckWarning";

interface Props {
  onClose: () => void;
  onSuccess: () => void;
  onFraudPrevented: () => void;
}

export default function SendMoneyModal({ onClose, onSuccess, onFraudPrevented }: Props) {
  const [upiId, setUpiId] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [checking, setChecking] = useState(false);
  const [riskResult, setRiskResult] = useState<{ flagged: boolean; riskScore: number; reason: string } | null>(null);
  const [sending, setSending] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced live check on every UPI ID keystroke
  useEffect(() => {
    setRiskResult(null);
    if (!upiId.trim()) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setChecking(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch("/api/check-recipient", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ upiId: upiId.trim() }),
        });
        const data = await res.json();
        setRiskResult(data);
      } catch {
        setRiskResult(null);
      } finally {
        setChecking(false);
      }
    }, 500);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [upiId]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();

    // If still checking, wait for it to finish first
    if (checking) return;

    // If no result yet (UPI was never checked), run a synchronous check now
    if (!riskResult && upiId.trim()) {
      setSending(true);
      try {
        const res = await fetch("/api/check-recipient", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ upiId: upiId.trim() }),
        });
        const data = await res.json();
        setRiskResult(data);
        if (data.flagged) { setShowWarning(true); setSending(false); return; }
      } catch {
        // fail open
      }
      setSending(false);
      onSuccess();
      return;
    }

    if (riskResult?.flagged) { setShowWarning(true); return; }

    setSending(true);
    await new Promise((r) => setTimeout(r, 700));
    setSending(false);
    onSuccess();
  }

  const isHighRisk = riskResult?.flagged === true;
  const score = riskResult?.riskScore ?? 0;
  const barColor = score > 70 ? "bg-red-500" : score >= 30 ? "bg-amber-500" : "bg-emerald-500";

  if (showWarning && riskResult) {
    return (
      <TrustCheckWarning
        riskScore={riskResult.riskScore}
        reason={riskResult.reason}
        onCancel={() => { setShowWarning(false); onFraudPrevented(); }}
        onContinue={() => { setShowWarning(false); onSuccess(); }}
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
          {/* UPI input with live indicator */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-500">To (UPI ID / Mobile)</label>
            <div className="relative">
              <input
                type="text"
                placeholder="e.g. friend@okicici"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                required
                className={`w-full rounded-xl border px-4 py-2.5 pr-10 text-sm placeholder-slate-400 focus:outline-none transition-colors ${
                  isHighRisk
                    ? "border-red-300 bg-red-50 text-red-800"
                    : riskResult
                    ? "border-emerald-300 bg-emerald-50 text-slate-800"
                    : "border-stone-200 bg-stone-50 text-slate-800 focus:border-[#2D6A4F]"
                }`}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {checking && <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />}
                {!checking && riskResult && !isHighRisk && <CheckCircle className="w-4 h-4 text-emerald-500" />}
                {!checking && isHighRisk && <AlertTriangle className="w-4 h-4 text-red-500" />}
              </div>
            </div>

            {riskResult && (
              <div className="flex flex-col gap-1 mt-0.5">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Risk Score</span>
                  <span className="font-semibold">{score}/100</span>
                </div>
                <div className="h-1.5 rounded-full bg-stone-100 overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${score}%` }} />
                </div>
              </div>
            )}

            {!checking && isHighRisk && (
              <div className="flex items-start gap-2 rounded-xl bg-red-50 border border-red-200 px-3 py-2.5 mt-1">
                <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <p className="text-xs text-red-600">{riskResult?.reason}</p>
              </div>
            )}
            {!checking && riskResult && !isHighRisk && (
              <p className="text-xs text-emerald-600 flex items-center gap-1 mt-0.5">
                <CheckCircle className="w-3.5 h-3.5" /> Recipient verified — low risk
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-500">Amount (₹)</label>
            <input
              type="number" placeholder="0.00" value={amount} min={1} required
              onChange={(e) => setAmount(e.target.value)}
              className="rounded-xl border border-stone-200 bg-stone-50 px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#2D6A4F] transition-colors"
            />
          </div>

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
            <p className="text-xs text-[#2D6A4F]">Every recipient is verified before sending</p>
          </div>

          <button
            type="submit"
            disabled={sending || checking}
            className={`rounded-xl transition-colors py-2.5 text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-60 ${
              isHighRisk ? "bg-red-500 hover:bg-red-600" : "bg-[#2D6A4F] hover:bg-[#245a42]"
            }`}
          >
            {sending
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
              : checking
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Verifying...</>
              : isHighRisk
              ? <><AlertTriangle className="w-4 h-4" /> Proceed with Warning</>
              : <><Send className="w-4 h-4" /> Send Money</>}
          </button>
        </form>
      </div>
    </div>
  );
}
