"use client";

import { useState, useEffect } from "react";
import { AlertTriangle } from "lucide-react";

interface Props {
  riskScore: number;
  reason: string;
  onCancel: () => void;
  onContinue: () => void;
}

export default function WarningScreen({ riskScore, reason, onCancel, onContinue }: Props) {
  const [countdown, setCountdown] = useState(30);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(interval);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const canContinue = countdown === 0 && confirmed;

  return (
    <div className="min-h-screen bg-red-950 text-white flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm flex flex-col gap-6">

        {/* Icon + heading */}
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-500/30 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-red-300">Fraud Warning</h1>
          <p className="text-red-200/70 text-sm">
            TrustCheck has flagged this recipient as high risk.
          </p>
        </div>

        {/* Risk score */}
        <div className="flex flex-col items-center gap-1">
          <span className="text-7xl font-black text-red-400">{riskScore}</span>
          <span className="text-red-300/60 text-sm uppercase tracking-widest">Risk Score / 100</span>
        </div>

        {/* Reason */}
        <div className="rounded-2xl bg-red-500/10 border border-red-500/20 px-5 py-4 text-sm text-red-200 text-center">
          {reason}
        </div>

        {/* Countdown */}
        <div className="flex items-center justify-center gap-2 text-sm text-red-300/70">
          {countdown > 0 ? (
            <>
              <span className="tabular-nums font-mono text-red-300 font-semibold">{countdown}s</span>
              <span>— please read before continuing</span>
            </>
          ) : (
            <span className="text-red-300">You may now confirm below.</span>
          )}
        </div>

        {/* Checkbox */}
        <label className="flex items-start gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            className="mt-0.5 w-4 h-4 accent-red-400 cursor-pointer"
          />
          <span className="text-sm text-red-200">
            I confirm this is NOT a scam and I take full responsibility for this transaction.
          </span>
        </label>

        {/* Buttons */}
        <div className="flex flex-col gap-3">
          <button
            onClick={onCancel}
            className="rounded-xl bg-emerald-600 hover:bg-emerald-500 transition-colors py-3 text-sm font-medium"
          >
            Cancel Transaction
          </button>
          <button
            onClick={onContinue}
            disabled={!canContinue}
            className="rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors py-3 text-sm font-medium"
          >
            {countdown > 0 ? `Continue (wait ${countdown}s)` : "Continue Anyway"}
          </button>
        </div>

      </div>
    </div>
  );
}
