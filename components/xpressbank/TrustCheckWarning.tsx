"use client";

import { useState } from "react";
import { AlertTriangle, ShieldAlert } from "lucide-react";
import CooldownTimer from "./CooldownTimer";

interface Props {
  riskScore: number;
  level: "low" | "medium" | "high";
  reasons: string[];
  onCancel: () => void;
  onContinue: () => void;
}

export default function TrustCheckWarning({ riskScore, level, reasons, onCancel, onContinue }: Props) {
  const [timerDone, setTimerDone] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const isHigh = level === "high";
  const headerBg = isHigh ? "bg-red-600" : "bg-amber-500";

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className={`${headerBg} px-6 py-5 flex flex-col items-center gap-2 text-center`}>
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-white font-bold text-base">
            {isHigh ? "⚠️ High-Risk Transaction Detected" : "⚠️ Medium-Risk Transaction"}
          </h2>
          <p className="text-white/80 text-xs">
            {isHigh ? "This transaction has been flagged as high risk" : "Proceed with caution"}
          </p>
        </div>

        <div className="p-6 flex flex-col gap-4">
          {/* Score + timer */}
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-slate-500">Risk Score</span>
              <span className={`text-5xl font-black ${isHigh ? "text-red-600" : "text-amber-500"}`}>{riskScore}</span>
              <span className="text-xs text-slate-400">/ 100</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <CooldownTimer initialSeconds={30} onComplete={() => setTimerDone(true)} />
              <span className="text-xs text-slate-400">seconds remaining</span>
            </div>
          </div>

          {/* Reasons list */}
          {reasons.length > 0 && (
            <div className={`rounded-xl border px-4 py-3 flex flex-col gap-2 ${isHigh ? "bg-red-50 border-red-100" : "bg-amber-50 border-amber-100"}`}>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Risk Factors Detected</p>
              {reasons.map((r, i) => (
                <div key={i} className="flex items-start gap-2">
                  <ShieldAlert className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${isHigh ? "text-red-500" : "text-amber-500"}`} />
                  <p className={`text-xs ${isHigh ? "text-red-700" : "text-amber-700"}`}>{r}</p>
                </div>
              ))}
            </div>
          )}

          {/* Checkbox */}
          <label className="flex items-start gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className={`mt-0.5 w-4 h-4 cursor-pointer ${isHigh ? "accent-red-500" : "accent-amber-500"}`}
            />
            <span className="text-sm text-slate-600">
              I confirm this is NOT a scam and I take full responsibility for this transaction.
            </span>
          </label>

          <p className="text-xs text-slate-400 italic">
            💡 Banks never ask you to send money to a different account.
          </p>

          <div className="flex flex-col gap-2">
            <button
              onClick={onCancel}
              className={`w-full rounded-xl transition-colors py-2.5 text-sm font-semibold text-white ${isHigh ? "bg-red-600 hover:bg-red-700" : "bg-amber-500 hover:bg-amber-600"}`}
            >
              Cancel Transaction
            </button>
            <button
              onClick={onContinue}
              disabled={!timerDone || !confirmed}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors py-2.5 text-sm font-medium text-slate-600"
            >
              {!timerDone ? `Continue Anyway (wait ${30}s)` : "Continue Anyway"}
            </button>
          </div>

          <button className={`text-xs hover:underline text-center ${isHigh ? "text-red-500" : "text-amber-500"}`} onClick={onCancel}>
            Report this as scam →
          </button>
        </div>
      </div>
    </div>
  );
}
