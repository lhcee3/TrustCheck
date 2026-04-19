"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Shield, Zap, ArrowUpRight, ArrowDownLeft, AlertTriangle, Activity, QrCode } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

interface Transaction {
  id: string; type: string; amount: number;
  recipientName: string; recipientUpi: string;
  senderName: string; senderUpi: string;
  timestamp: string; status: string;
  riskScore: number; trustCheckFlagged: boolean;
}

function RiskBadge({ score }: { score: number }) {
  const color = score >= 70 ? "text-red-400 bg-red-400/10 border-red-400/20"
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
  const [newFlash, setNewFlash] = useState<string | null>(null);
  const [monitorUrl, setMonitorUrl] = useState("");
  const [showQr, setShowQr] = useState(false);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    setMonitorUrl(`${window.location.origin}/monitor`);

    const es = new EventSource("/api/live-feed");
    esRef.current = es;
    es.onopen = () => setConnected(true);
    es.onerror = () => setConnected(false);
    es.onmessage = (e) => {
      const data = JSON.parse(e.data) as { type: string; transactions: Transaction[] };
      if (data.type === "snapshot") {
        setTransactions(data.transactions);
        setSavedAmount(data.transactions.filter((t) => t.status === "blocked").reduce((s, t) => s + t.amount, 0));
      } else if (data.type === "new") {
        setTransactions((prev) => [...data.transactions, ...prev].slice(0, 50));
        data.transactions.forEach((t) => {
          if (t.status === "blocked") setSavedAmount((s) => s + t.amount);
          setNewFlash(t.id);
          setTimeout(() => setNewFlash(null), 2000);
        });
      }
    };
    return () => { es.close(); setConnected(false); };
  }, []);

  const blockedCount = transactions.filter((t) => t.status === "blocked").length;
  const avgRisk = transactions.length > 0
    ? Math.round(transactions.reduce((s, t) => s + t.riskScore, 0) / transactions.length)
    : 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center">
            <Shield className="w-4 h-4 text-emerald-400" />
          </div>
          <span className="font-bold text-slate-100">TrustCheck Monitor</span>
          <span className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border ${connected ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${connected ? "bg-emerald-400 animate-pulse" : "bg-red-400"}`} />
            {connected ? "Live" : "Disconnected"}
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
          { label: "Blocked", value: blockedCount, color: "text-red-400" },
          { label: "Avg Risk Score", value: avgRisk, color: avgRisk >= 70 ? "text-red-400" : avgRisk >= 30 ? "text-amber-400" : "text-emerald-400" },
          { label: "Money Saved", value: fmt(savedAmount), color: "text-emerald-400" },
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
          const isBlocked = tx.status === "blocked";
          const isReceived = tx.type === "received";
          const isNew = newFlash === tx.id;
          return (
            <div key={tx.id}
              className={`rounded-2xl border p-4 flex items-center gap-3 transition-all duration-500 ${isNew ? "border-emerald-500/40 bg-emerald-500/5" : isBlocked ? "border-red-500/20 bg-red-500/5" : "border-slate-800 bg-slate-900"}`}>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isReceived ? "bg-emerald-500/10 text-emerald-400" : isBlocked ? "bg-red-500/10 text-red-400" : "bg-slate-800 text-slate-400"}`}>
                {isReceived ? <ArrowDownLeft className="w-4 h-4" /> : isBlocked ? <AlertTriangle className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-200 truncate">{isReceived ? tx.senderName : tx.recipientName}</p>
                <p className="text-xs text-slate-500 font-mono truncate">{isReceived ? tx.senderUpi : tx.recipientUpi}</p>
                <p className="text-xs text-slate-600 mt-0.5">{new Date(tx.timestamp).toLocaleTimeString("en-IN")}</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <RiskBadge score={tx.riskScore} />
                <p className={`text-sm font-bold ${isReceived ? "text-emerald-400" : isBlocked ? "text-red-400 line-through" : "text-slate-200"}`}>
                  {isReceived ? "+" : "-"}{fmt(tx.amount)}
                </p>
                {isBlocked
                  ? <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 px-2 py-0.5 text-xs font-medium"><Shield className="w-3 h-3" /> Blocked</span>
                  : <span className="inline-flex items-center rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 text-xs font-medium">✓ Allowed</span>
                }
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
