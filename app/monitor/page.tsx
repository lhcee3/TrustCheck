"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { Shield, Zap, ArrowUpRight, ArrowDownLeft, AlertTriangle, Activity, QrCode, XCircle } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

interface Transaction {
  id: string; type: string; amount: number;
  recipientName: string; recipientUpi: string;
  senderName: string; senderUpi: string;
  timestamp: string; status: string;
  riskScore: number; trustCheckFlagged: boolean;
}

function isFraud(tx: Transaction) {
  return tx.status === "blocked" || tx.trustCheckFlagged || tx.riskScore >= 60;
}

function RiskBadge({ score }: { score: number }) {
  const color = score >= 60 ? "text-red-400 bg-red-400/10 border-red-400/20"
    : score >= 30 ? "text-amber-400 bg-amber-400/10 border-amber-400/20"
    : "text-emerald-400 bg-emerald-400/10 border-emerald-400/20";
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-bold ${color}`}>
      {score}
    </span>
  );
}

const fmt = (n: number) => "₹" + n.toLocaleString("en-IN");

export default function MonitorPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [connected, setConnected] = useState(false);
  const [savedAmount, setSavedAmount] = useState(0);
  const [urgentAlert, setUrgentAlert] = useState<Transaction | null>(null);
  const [monitorUrl, setMonitorUrl] = useState("");
  const [showQr, setShowQr] = useState(false);
  const esRef = useRef<EventSource | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const connect = useCallback(() => {
    if (esRef.current) esRef.current.close();

    const es = new EventSource("/api/live-feed");
    esRef.current = es;

    es.onopen = () => {
      setConnected(true);
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
    };

    es.onerror = () => {
      setConnected(false);
      es.close();
      // Auto-reconnect after 5 seconds
      reconnectRef.current = setTimeout(() => connect(), 5000);
    };

    es.onmessage = (e) => {
      const data = JSON.parse(e.data) as { type: string; transactions: Transaction[] };
      if (data.type === "snapshot") {
        setTransactions(data.transactions);
        setSavedAmount(data.transactions.filter(isFraud).reduce((s, t) => s + t.amount, 0));
      } else if (data.type === "new") {
        setTransactions((prev) => [...data.transactions, ...prev].slice(0, 50));
        data.transactions.forEach((t) => {
          if (isFraud(t)) {
            setSavedAmount((s) => s + t.amount);
            // Show urgent alert banner
            setUrgentAlert(t);
            // Play alert sound via Web Audio API
            try {
              const ctx = new AudioContext();
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              osc.connect(gain); gain.connect(ctx.destination);
              osc.frequency.setValueAtTime(880, ctx.currentTime);
              osc.frequency.setValueAtTime(440, ctx.currentTime + 0.1);
              osc.frequency.setValueAtTime(880, ctx.currentTime + 0.2);
              gain.gain.setValueAtTime(0.3, ctx.currentTime);
              gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
              osc.start(); osc.stop(ctx.currentTime + 0.4);
            } catch { /* ignore */ }
          }
        });
      }
    };
  }, []);

  useEffect(() => {
    setMonitorUrl(`${window.location.origin}/monitor`);
    connect();
    return () => {
      esRef.current?.close();
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
    };
  }, [connect]);

  const blockedCount = transactions.filter(isFraud).length;
  const avgRisk = transactions.length > 0
    ? Math.round(transactions.reduce((s, t) => s + t.riskScore, 0) / transactions.length)
    : 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">

      {/* ── Urgent fraud alert banner ── */}
      {urgentAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md mx-4 bg-red-950 border-2 border-red-500 rounded-3xl overflow-hidden shadow-2xl shadow-red-500/20">
            <div className="bg-red-600 px-6 py-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center animate-pulse">
                <AlertTriangle className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-bold text-white text-base">🚨 FRAUD DETECTED — STOP PAYMENT</p>
                <p className="text-red-200 text-xs">TrustCheck has flagged this transaction</p>
              </div>
            </div>
            <div className="px-6 py-5 flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <div className="flex justify-between text-sm">
                  <span className="text-red-300">Recipient UPI</span>
                  <span className="text-white font-mono font-bold">{urgentAlert.recipientUpi}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-red-300">Amount</span>
                  <span className="text-white font-bold">{fmt(urgentAlert.amount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-red-300">Risk Score</span>
                  <span className="text-red-400 font-bold text-lg">{urgentAlert.riskScore}/100</span>
                </div>
              </div>
              <p className="text-red-200 text-xs text-center bg-red-900/50 rounded-xl px-4 py-2">
                ⚠️ This UPI ID has been flagged as high risk. Do NOT proceed with this payment.
              </p>
              <button onClick={() => setUrgentAlert(null)}
                className="w-full rounded-xl bg-red-600 hover:bg-red-500 transition-colors py-3 text-sm font-bold text-white flex items-center justify-center gap-2">
                <XCircle className="w-4 h-4" /> Dismiss Alert
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center">
            <Shield className="w-4 h-4 text-emerald-400" />
          </div>
          <span className="font-bold text-slate-100">TrustCheck Monitor</span>
          <span className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border ${connected ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${connected ? "bg-emerald-400 animate-pulse" : "bg-red-400 animate-pulse"}`} />
            {connected ? "Live" : "Reconnecting..."}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowQr((v) => !v)}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors border border-slate-700 rounded-xl px-3 py-1.5">
            <QrCode className="w-3.5 h-3.5" /> Share
          </button>
          <Link href="/xpressbank/dashboard" className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors">
            <Zap className="w-3.5 h-3.5" /> XpressBank
          </Link>
        </div>
      </header>

      {/* QR panel */}
      {showQr && monitorUrl && (
        <div className="border-b border-slate-800 px-6 py-5 flex items-center gap-6 bg-slate-900">
          <div className="bg-white p-3 rounded-2xl shrink-0">
            <QRCodeSVG value={monitorUrl} size={96} />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-200">Scan to open on your phone</p>
            <p className="text-xs text-slate-500 mt-1">See live fraud alerts on any device</p>
            <p className="text-xs text-slate-600 font-mono mt-2 break-all">{monitorUrl}</p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 px-6 py-5 border-b border-slate-800">
        {[
          { label: "Transactions", value: transactions.length, color: "text-slate-100" },
          { label: "Fraud Detected", value: blockedCount, color: "text-red-400" },
          { label: "Avg Risk Score", value: avgRisk, color: avgRisk >= 60 ? "text-red-400" : avgRisk >= 30 ? "text-amber-400" : "text-emerald-400" },
          { label: "Money Protected", value: fmt(savedAmount), color: "text-emerald-400" },
        ].map((s) => (
          <div key={s.label} className="bg-slate-900 rounded-2xl border border-slate-800 p-4">
            <p className="text-xs text-slate-500 font-medium">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Feed */}
      <div className="flex-1 px-6 py-5 flex flex-col gap-3 overflow-y-auto">
        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium mb-1">
          <Activity className="w-3.5 h-3.5" /> Live Transaction Feed
        </div>
        {transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Activity className="w-10 h-10 text-slate-700" />
            <p className="text-slate-500 text-sm">Waiting for transactions...</p>
            <p className="text-slate-600 text-xs">Send a payment in XpressBank to see it appear here</p>
          </div>
        ) : transactions.map((tx) => {
          const fraud = isFraud(tx);
          const isReceived = tx.type === "received";
          return (
            <div key={tx.id}
              className={`rounded-2xl border p-4 flex items-center gap-3 transition-all duration-300 ${
                fraud
                  ? "border-red-500/50 bg-red-500/10 shadow-lg shadow-red-500/10"
                  : "border-slate-800 bg-slate-900"
              }`}>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                isReceived ? "bg-emerald-500/10 text-emerald-400"
                : fraud ? "bg-red-500/20 text-red-400"
                : "bg-slate-800 text-slate-400"
              }`}>
                {isReceived ? <ArrowDownLeft className="w-4 h-4" /> : fraud ? <AlertTriangle className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold truncate ${fraud ? "text-red-300" : "text-slate-200"}`}>
                  {isReceived ? tx.senderName : tx.recipientName}
                </p>
                <p className={`text-xs font-mono truncate ${fraud ? "text-red-400/70" : "text-slate-500"}`}>
                  {isReceived ? tx.senderUpi : tx.recipientUpi}
                </p>
                <p className="text-xs text-slate-600 mt-0.5">{new Date(tx.timestamp).toLocaleTimeString("en-IN")}</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <RiskBadge score={tx.riskScore} />
                <p className={`text-sm font-bold ${isReceived ? "text-emerald-400" : fraud ? "text-red-400 line-through" : "text-slate-200"}`}>
                  {isReceived ? "+" : "-"}{fmt(tx.amount)}
                </p>
                {fraud
                  ? <span className="inline-flex items-center gap-1 rounded-full bg-red-500/20 border border-red-500/40 text-red-400 px-2 py-0.5 text-xs font-bold">
                      <Shield className="w-3 h-3" /> FRAUD
                    </span>
                  : <span className="inline-flex items-center rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 text-xs font-medium">
                      ✓ Safe
                    </span>
                }
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
