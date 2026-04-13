"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Zap, Bell, Shield, Send, ArrowDownLeft, QrCode,
  FileText, Home, Receipt, User, Eye, EyeOff,
  Wallet, CreditCard, TrendingUp, TrendingDown,
  ChevronRight, Copy, CheckCircle, ArrowUpRight, AlertTriangle,
} from "lucide-react";
import SendMoneyModal from "@/components/xpressbank/SendMoneyModal";

// ── Mock data ────────────────────────────────────────────────────────────────
const TRANSACTIONS = [
  { id: 1, type: "received", name: "Salary Credit", upi: "corp@hdfcbank", amount: 85000, date: "Apr 1, 2026" },
  { id: 2, type: "sent", name: "Kiran Stores", upi: "kiran@okhdfc", amount: 850, date: "Apr 3, 2026" },
  { id: 3, type: "sent", name: "Electricity Bill", upi: "billing@paytm", amount: 1200, date: "Apr 5, 2026" },
  { id: 4, type: "received", name: "Rahul Verma", upi: "rahul@okicici", amount: 5000, date: "Apr 7, 2026" },
  { id: 5, type: "sent", name: "Amazon Pay", upi: "amazon@apl", amount: 3499, date: "Apr 8, 2026" },
  { id: 6, type: "blocked", name: "Scammer Alert Test", upi: "scammer@okhdfcbank", amount: 25000, date: "Apr 11, 2026" },
];

const SPENDING = [
  { label: "Shopping", pct: 40, color: "#2D6A4F" },
  { label: "Bills", pct: 30, color: "#D97706" },
  { label: "Transfers", pct: 20, color: "#6366F1" },
  { label: "Others", pct: 10, color: "#94A3B8" },
];

const fmt = (n: number) => "₹" + n.toLocaleString("en-IN");

// ── Spending donut ────────────────────────────────────────────────────────────
function SpendingDonut() {
  const size = 110; const r = 38; const cx = size / 2; const cy = size / 2;
  const circ = 2 * Math.PI * r;
  let offset = 0;
  const segs = SPENDING.map((s) => {
    const dash = (s.pct / 100) * circ;
    const seg = { ...s, dash, offset };
    offset += dash;
    return seg;
  });
  return (
    <div className="flex items-center gap-5">
      <svg width={size} height={size} className="shrink-0">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#F5F3F0" strokeWidth={14} />
        {segs.map((s) => (
          <circle key={s.label} cx={cx} cy={cy} r={r} fill="none"
            stroke={s.color} strokeWidth={14}
            strokeDasharray={`${s.dash} ${circ - s.dash}`}
            strokeDashoffset={-s.offset} strokeLinecap="butt"
            style={{ transform: "rotate(-90deg)", transformOrigin: "50% 50%" }}
          />
        ))}
      </svg>
      <div className="flex flex-col gap-1.5">
        {SPENDING.map((s) => (
          <div key={s.label} className="flex items-center gap-2 text-xs text-slate-600">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s.color }} />
            <span>{s.label}</span>
            <span className="text-slate-400 ml-auto pl-2">{s.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main dashboard ────────────────────────────────────────────────────────────
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
      if (localStorage.getItem("xb_loggedIn") !== "true") {
        router.replace("/xpressbank/login");
        return;
      }
      setUserName(localStorage.getItem("xb_userName") ?? "Ramesh Sharma");
      setUpiId(localStorage.getItem("xb_upiId") ?? "ramesh@xpressbank");
    }
  }, [router]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  function logout() { localStorage.clear(); router.push("/xpressbank/login"); }

  function copyUpi() {
    navigator.clipboard.writeText(upiId);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const initials = userName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-[#F7F6F2]">
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-slate-800 text-white text-sm px-5 py-3 rounded-2xl shadow-lg">
          {toast}
        </div>
      )}

      {showSend && (
        <SendMoneyModal
          onClose={() => setShowSend(false)}
          onSuccess={() => { setShowSend(false); showToast("✅ Transaction initiated successfully"); }}
          onFraudPrevented={() => { setShowSend(false); showToast("🛡️ Fraud prevented — your money is safe!"); }}
        />
      )}

      {/* Top nav */}
      <div className="bg-white border-b border-stone-100 px-4 sm:px-8 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#2D6A4F] flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-slate-800 text-sm">XpressBank</span>
        </div>
        <p className="hidden sm:block text-sm text-slate-500">Welcome back, <span className="font-semibold text-slate-700">{userName}</span></p>
        <div className="flex items-center gap-3">
          <button className="relative text-slate-400 hover:text-slate-600 transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-red-500" />
          </button>
          <Link href="/xpressbank/profile">
            <div className="w-8 h-8 rounded-full bg-[#2D6A4F] flex items-center justify-center text-white text-xs font-bold">{initials}</div>
          </Link>
          <button onClick={logout} className="hidden sm:block text-xs text-slate-400 hover:text-red-500 transition-colors">Logout</button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-8 py-6 pb-24 sm:pb-10 flex flex-col gap-6">

        {/* Welcome + date */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-800">Good morning, {userName.split(" ")[0]} 👋</h1>
            <p className="text-slate-500 text-sm mt-0.5">Here's your financial overview for today</p>
          </div>
          <span className="hidden sm:block text-xs text-slate-400 mt-1">Monday, 15 April 2026</span>
        </div>

        {/* Fraud protection banner */}
        <div className="rounded-2xl bg-[#2D6A4F] px-5 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-white text-sm font-semibold">🛡️ Fraud Protection Active</p>
              <p className="text-emerald-100 text-xs">All transactions verified in real-time · 127 blocked this month</p>
            </div>
          </div>
          <span className="hidden sm:flex items-center gap-1.5 text-xs text-emerald-100">
            <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" /> Live
          </span>
        </div>

        {/* Balance cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Main balance card */}
          <div className="bg-[#2D6A4F] rounded-2xl p-5 text-white flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-100 text-xs font-medium">
                <Wallet className="w-3.5 h-3.5" /> Total Balance
              </div>
              <button onClick={() => setBalanceVisible((v) => !v)} className="text-emerald-200 hover:text-white transition-colors">
                {balanceVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-3xl font-bold tracking-tight">{balanceVisible ? "₹4,25,000" : "••••••"}</p>
            <div className="flex items-center gap-1 text-emerald-100 text-xs">
              <TrendingUp className="w-3.5 h-3.5" /> +₹85,000 this month
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-stone-100 shadow-sm flex flex-col gap-3">
            <div className="flex items-center gap-2 text-slate-500 text-xs font-medium">
              <CreditCard className="w-3.5 h-3.5" /> Available Balance
            </div>
            <p className="text-2xl font-bold text-slate-800">{balanceVisible ? "₹3,80,000" : "••••••"}</p>
            <span className="inline-flex items-center rounded-full bg-emerald-50 border border-emerald-100 text-[#2D6A4F] px-2.5 py-0.5 text-xs font-medium">Savings Account</span>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-stone-100 shadow-sm flex flex-col gap-3">
            <div className="flex items-center gap-2 text-slate-500 text-xs font-medium">
              <TrendingDown className="w-3.5 h-3.5" /> Today's Spend
            </div>
            <p className="text-2xl font-bold text-slate-800">{balanceVisible ? "₹2,450" : "••••••"}</p>
            <span className="inline-flex items-center rounded-full bg-amber-50 border border-amber-100 text-amber-700 px-2.5 py-0.5 text-xs font-medium">3 transactions</span>
          </div>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: <Send className="w-5 h-5" />, label: "Send Money", bg: "bg-[#2D6A4F]/10 text-[#2D6A4F]", action: () => setShowSend(true) },
            { icon: <ArrowDownLeft className="w-5 h-5" />, label: "Request Money", bg: "bg-indigo-50 text-indigo-600", action: () => showToast("Request Money — demo mode") },
            { icon: <QrCode className="w-5 h-5" />, label: "Scan & Pay", bg: "bg-amber-50 text-amber-600", action: () => showToast("Scan QR — demo mode") },
            { icon: <FileText className="w-5 h-5" />, label: "Statements", bg: "bg-slate-100 text-slate-600", action: () => router.push("/xpressbank/transactions") },
          ].map((a) => (
            <button key={a.label} onClick={a.action}
              className="bg-white rounded-2xl p-4 border border-stone-100 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all flex flex-col items-center gap-2.5 text-center"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${a.bg}`}>{a.icon}</div>
              <span className="text-xs font-medium text-slate-700">{a.label}</span>
            </button>
          ))}
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Transactions — 2 cols */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-stone-50">
              <h2 className="text-sm font-bold text-slate-800">Recent Activity</h2>
              <Link href="/xpressbank/transactions" className="text-xs text-[#2D6A4F] hover:underline flex items-center gap-0.5">
                View All <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="divide-y divide-stone-50">
              {TRANSACTIONS.map((tx) => (
                <div key={tx.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-stone-50 transition-colors">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    tx.type === "received" ? "bg-emerald-50 text-emerald-600" :
                    tx.type === "blocked" ? "bg-red-50 text-red-500" :
                    "bg-stone-100 text-slate-500"
                  }`}>
                    {tx.type === "received" ? <ArrowDownLeft className="w-4 h-4" /> :
                     tx.type === "blocked" ? <AlertTriangle className="w-4 h-4" /> :
                     <ArrowUpRight className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{tx.name}</p>
                    <p className="text-xs text-slate-400 font-mono truncate">{tx.upi}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-sm font-semibold ${
                      tx.type === "received" ? "text-emerald-600" :
                      tx.type === "blocked" ? "text-red-500" : "text-slate-700"
                    }`}>
                      {tx.type === "received" ? "+" : "-"}{fmt(tx.amount)}
                    </p>
                    <p className="text-xs text-slate-400">{tx.date}</p>
                  </div>
                  <div className="shrink-0 ml-2">
                    {tx.type === "blocked"
                      ? <span className="inline-flex items-center gap-1 rounded-full bg-red-50 border border-red-200 text-red-600 px-2 py-0.5 text-xs font-medium"><Shield className="w-3 h-3" /> Blocked</span>
                      : <span className="inline-flex items-center rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 px-2 py-0.5 text-xs font-medium">Success</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-4">
            {/* Monthly stats */}
            <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5 flex flex-col gap-4">
              <h2 className="text-sm font-bold text-slate-800">This Month</h2>
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500 flex items-center gap-1.5"><ArrowUpRight className="w-3.5 h-3.5 text-red-400" /> Total Sent</span>
                  <span className="text-sm font-semibold text-slate-800">₹28,500</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500 flex items-center gap-1.5"><ArrowDownLeft className="w-3.5 h-3.5 text-emerald-500" /> Total Received</span>
                  <span className="text-sm font-semibold text-slate-800">₹90,000</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500 flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-[#2D6A4F]" /> Fraud Blocked</span>
                  <span className="text-sm font-semibold text-red-500">3 attempts</span>
                </div>
              </div>
            </div>

            {/* Spending donut */}
            <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5 flex flex-col gap-4">
              <h2 className="text-sm font-bold text-slate-800">Spending Insights</h2>
              <SpendingDonut />
            </div>

            {/* UPI ID */}
            <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5 flex flex-col gap-3">
              <h2 className="text-sm font-bold text-slate-800">Your UPI ID</h2>
              <div className="flex items-center justify-between rounded-xl bg-stone-50 border border-stone-100 px-3 py-2.5">
                <span className="text-xs font-mono text-slate-700 truncate">{upiId}</span>
                <button onClick={copyUpi} className="text-slate-400 hover:text-[#2D6A4F] transition-colors shrink-0 ml-2">
                  {copied ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-stone-50 border border-stone-100 px-3 py-2.5">
                <span className="text-xs font-mono text-slate-700 truncate">ramesh.savings@okhdfc</span>
                <Copy className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-2" />
              </div>
            </div>

            {/* Linked accounts */}
            <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5 flex flex-col gap-3">
              <h2 className="text-sm font-bold text-slate-800">Linked Accounts</h2>
              {[{ label: "Savings", num: "••••1234" }, { label: "Current", num: "••••5678" }].map((a) => (
                <div key={a.label} className="flex items-center justify-between rounded-xl bg-stone-50 border border-stone-100 px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-xs font-medium text-slate-700">{a.label}</span>
                  </div>
                  <span className="text-xs text-slate-400 font-mono">{a.num}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile bottom nav */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-stone-100 flex items-center justify-around px-4 py-3 z-30">
        {[
          { icon: <Home className="w-5 h-5" />, label: "Home", href: "/xpressbank/dashboard", active: true },
          { icon: <Receipt className="w-5 h-5" />, label: "Transactions", href: "/xpressbank/transactions", active: false },
          { icon: <Send className="w-5 h-5" />, label: "Send", href: "#", active: false },
          { icon: <User className="w-5 h-5" />, label: "Profile", href: "/xpressbank/profile", active: false },
        ].map((item) => (
          <Link key={item.label} href={item.href}
            onClick={item.label === "Send" ? (e) => { e.preventDefault(); setShowSend(true); } : undefined}
            className={`flex flex-col items-center gap-0.5 ${item.active ? "text-[#2D6A4F]" : "text-slate-400"}`}
          >
            {item.icon}
            <span className="text-[10px] font-medium">{item.label}</span>
          </Link>
        ))}
      </div>

      {/* Floating widget */}
      <div className="hidden sm:flex fixed bottom-6 right-6 items-center gap-2 bg-white border border-emerald-100 shadow-md rounded-2xl px-4 py-2.5 z-30">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <Shield className="w-4 h-4 text-[#2D6A4F]" />
        <span className="text-xs font-medium text-[#2D6A4F]">Protected</span>
      </div>
    </div>
  );
}
