"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Zap, Bell, Shield, Send, ArrowDownLeft, QrCode,
  FileText, Home, Receipt, User, Eye, EyeOff,
  TrendingUp, TrendingDown, Copy, CheckCircle,
  ArrowUpRight, AlertTriangle, ChevronRight,
} from "lucide-react";
import SendMoneyModal from "@/components/xpressbank/SendMoneyModal";

const TRANSACTIONS = [
  { id: 1, type: "received", name: "Salary Credit", upi: "corp@hdfcbank", amount: 85000, date: "Apr 1" },
  { id: 2, type: "sent", name: "Kiran Stores", upi: "kiran@okhdfc", amount: 850, date: "Apr 3" },
  { id: 3, type: "sent", name: "Electricity Bill", upi: "billing@paytm", amount: 1200, date: "Apr 5" },
  { id: 4, type: "received", name: "Rahul Verma", upi: "rahul@okicici", amount: 5000, date: "Apr 7" },
  { id: 5, type: "blocked", name: "Scammer Alert", upi: "scammer@okhdfcbank", amount: 25000, date: "Apr 11" },
];

const SPENDING = [
  { label: "Shopping", pct: 40, color: "#2D6A4F" },
  { label: "Bills", pct: 30, color: "#D97706" },
  { label: "Transfers", pct: 20, color: "#6366F1" },
  { label: "Others", pct: 10, color: "#94A3B8" },
];

const fmt = (n: number) => "₹" + n.toLocaleString("en-IN");

function SpendingDonut() {
  const size = 100; const r = 34; const cx = 50; const cy = 50;
  const circ = 2 * Math.PI * r;
  let offset = 0;
  const segs = SPENDING.map((s) => {
    const dash = (s.pct / 100) * circ;
    const seg = { ...s, dash, offset };
    offset += dash;
    return seg;
  });
  return (
    <div className="flex items-center gap-4">
      <svg width={size} height={size} className="shrink-0">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#F0EDE8" strokeWidth={12} />
        {segs.map((s) => (
          <circle key={s.label} cx={cx} cy={cy} r={r} fill="none"
            stroke={s.color} strokeWidth={12}
            strokeDasharray={`${s.dash} ${circ - s.dash}`}
            strokeDashoffset={-s.offset} strokeLinecap="butt"
            style={{ transform: "rotate(-90deg)", transformOrigin: "50% 50%" }}
          />
        ))}
      </svg>
      <div className="flex flex-col gap-1">
        {SPENDING.map((s) => (
          <div key={s.label} className="flex items-center gap-2 text-xs text-slate-600">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: s.color }} />
            <span>{s.label}</span>
            <span className="text-slate-400 ml-auto pl-2">{s.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function XpressBankDashboard() {
  const router = useRouter();
  const [userName, setUserName] = useState("Ramesh Sharma");
  const [upiId, setUpiId] = useState("ramesh@xpressbank");
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [showSend, setShowSend] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (localStorage.getItem("xb_loggedIn") !== "true") { router.replace("/xpressbank/login"); return; }
      setUserName(localStorage.getItem("xb_userName") ?? "Ramesh Sharma");
      setUpiId(localStorage.getItem("xb_upiId") ?? "ramesh@xpressbank");
    }
  }, [router]);

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(null), 3000); }
  function logout() { localStorage.clear(); router.push("/xpressbank/login"); }
  function copyUpi() { navigator.clipboard.writeText(upiId); setCopied(true); setTimeout(() => setCopied(false), 1500); }

  const firstName = userName.split(" ")[0];
  const initials = userName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-[#F7F6F2] flex flex-col">
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-slate-800 text-white text-sm px-5 py-3 rounded-2xl shadow-lg whitespace-nowrap">
          {toast}
        </div>
      )}

      {showSend && (
        <SendMoneyModal
          onClose={() => setShowSend(false)}
          onSuccess={() => { setShowSend(false); showToast("✅ Transaction initiated"); }}
          onFraudPrevented={() => { setShowSend(false); showToast("🛡️ Fraud prevented — money safe!"); }}
        />
      )}

      {/* ── Header ── */}
      <div className="bg-[#2D6A4F] px-5 pt-12 pb-6">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-white/20 flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-white text-sm">XpressBank</span>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative text-white/70">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-red-400" />
            </button>
            <Link href="/xpressbank/profile">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white text-xs font-bold">{initials}</div>
            </Link>
          </div>
        </div>

        {/* Welcome */}
        <p className="text-emerald-200 text-sm">Good morning 👋</p>
        <h1 className="text-white text-xl font-bold mt-0.5">{firstName}</h1>

        {/* Balance hero */}
        <div className="mt-5 bg-white/10 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-1">
            <span className="text-emerald-200 text-xs font-medium">Total Balance</span>
            <button onClick={() => setBalanceVisible((v) => !v)} className="text-emerald-200">
              {balanceVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-white text-4xl font-black tracking-tight">
            {balanceVisible ? "₹4,25,000" : "••••••"}
          </p>
          <div className="flex items-center gap-1 mt-2 text-emerald-200 text-xs">
            <TrendingUp className="w-3.5 h-3.5" /> +₹85,000 this month
          </div>

          {/* Mini stats row */}
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="bg-white/10 rounded-xl px-3 py-2.5">
              <p className="text-emerald-200 text-xs">Available</p>
              <p className="text-white font-bold text-sm mt-0.5">{balanceVisible ? "₹3,80,000" : "••••"}</p>
            </div>
            <div className="bg-white/10 rounded-xl px-3 py-2.5">
              <p className="text-emerald-200 text-xs">Today's Spend</p>
              <p className="text-white font-bold text-sm mt-0.5">{balanceVisible ? "₹2,450" : "••••"}</p>
            </div>
          </div>
        </div>

        {/* Fraud protection pill */}
        <div className="flex items-center gap-2 mt-4">
          <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
          <span className="text-emerald-200 text-xs">Fraud protection active · 127 blocked this month</span>
        </div>
      </div>

      {/* ── Scrollable content ── */}
      <div className="flex-1 px-4 py-5 pb-28 flex flex-col gap-5 overflow-y-auto">

        {/* Quick actions */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { icon: <Send className="w-5 h-5" />, label: "Send", bg: "bg-[#2D6A4F] text-white", action: () => setShowSend(true) },
            { icon: <ArrowDownLeft className="w-5 h-5" />, label: "Request", bg: "bg-white text-indigo-600", action: () => showToast("Request Money — demo") },
            { icon: <QrCode className="w-5 h-5" />, label: "Scan", bg: "bg-white text-amber-600", action: () => showToast("Scan QR — demo") },
            { icon: <FileText className="w-5 h-5" />, label: "History", bg: "bg-white text-slate-600", action: () => router.push("/xpressbank/transactions") },
          ].map((a) => (
            <button key={a.label} onClick={a.action}
              className="flex flex-col items-center gap-2 active:scale-95 transition-transform"
            >
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm ${a.bg}`}>{a.icon}</div>
              <span className="text-xs font-medium text-slate-600">{a.label}</span>
            </button>
          ))}
        </div>

        {/* UPI ID card */}
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm px-4 py-3.5 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">Your UPI ID</p>
            <p className="text-sm font-mono font-semibold text-slate-800 mt-0.5">{upiId}</p>
          </div>
          <button onClick={copyUpi} className="w-9 h-9 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-center text-slate-400 hover:text-[#2D6A4F] transition-colors">
            {copied ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>

        {/* Recent transactions */}
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-stone-50">
            <h2 className="text-sm font-bold text-slate-800">Recent Activity</h2>
            <Link href="/xpressbank/transactions" className="text-xs text-[#2D6A4F] flex items-center gap-0.5">
              View All <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-stone-50">
            {TRANSACTIONS.map((tx) => (
              <div key={tx.id} className="flex items-center gap-3 px-4 py-3.5 active:bg-stone-50 transition-colors">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  tx.type === "received" ? "bg-emerald-50 text-emerald-600" :
                  tx.type === "blocked" ? "bg-red-50 text-red-500" : "bg-stone-100 text-slate-500"
                }`}>
                  {tx.type === "received" ? <ArrowDownLeft className="w-4 h-4" /> :
                   tx.type === "blocked" ? <AlertTriangle className="w-4 h-4" /> :
                   <ArrowUpRight className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{tx.name}</p>
                  <p className="text-xs text-slate-400 font-mono truncate">{tx.upi}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className={`text-sm font-bold ${
                    tx.type === "received" ? "text-emerald-600" :
                    tx.type === "blocked" ? "text-red-500" : "text-slate-700"
                  }`}>
                    {tx.type === "received" ? "+" : "-"}{fmt(tx.amount)}
                  </p>
                  <p className="text-xs text-slate-400">{tx.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Spending insights */}
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-800">Spending Insights</h2>
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span className="flex items-center gap-1"><TrendingDown className="w-3.5 h-3.5 text-red-400" /> ₹28,500 sent</span>
              <span className="flex items-center gap-1"><TrendingUp className="w-3.5 h-3.5 text-emerald-500" /> ₹90,000 received</span>
            </div>
          </div>
          <SpendingDonut />
        </div>

        {/* Linked accounts */}
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-4 flex flex-col gap-3">
          <h2 className="text-sm font-bold text-slate-800">Linked Accounts</h2>
          {[{ label: "Savings Account", num: "••••1234", color: "bg-[#2D6A4F]/10 text-[#2D6A4F]" },
            { label: "Current Account", num: "••••5678", color: "bg-indigo-50 text-indigo-600" }].map((a) => (
            <div key={a.label} className="flex items-center justify-between rounded-xl bg-stone-50 border border-stone-100 px-4 py-3">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${a.color}`}>
                  <FileText className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium text-slate-700">{a.label}</span>
              </div>
              <span className="text-xs text-slate-400 font-mono">{a.num}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Bottom nav ── */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-stone-100 flex items-center justify-around px-2 py-2 z-30 safe-area-bottom">
        {[
          { icon: <Home className="w-5 h-5" />, label: "Home", href: "/xpressbank/dashboard", active: true },
          { icon: <Receipt className="w-5 h-5" />, label: "History", href: "/xpressbank/transactions", active: false },
          { icon: <Send className="w-5 h-5" />, label: "Send", href: "#", active: false },
          { icon: <Shield className="w-5 h-5" />, label: "Security", href: "#", active: false },
          { icon: <User className="w-5 h-5" />, label: "Profile", href: "/xpressbank/profile", active: false },
        ].map((item) => (
          <Link key={item.label} href={item.href}
            onClick={item.label === "Send" ? (e) => { e.preventDefault(); setShowSend(true); } :
                     item.label === "Security" ? (e) => { e.preventDefault(); showToast("🛡️ Fraud protection is active"); } : undefined}
            className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors ${
              item.active ? "text-[#2D6A4F] bg-[#2D6A4F]/10" : "text-slate-400"
            }`}
          >
            {item.icon}
            <span className="text-[10px] font-medium">{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
