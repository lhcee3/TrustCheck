"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  Zap, Bell, Shield, Send, ArrowDownLeft, QrCode, FileText,
  Home, Receipt, User, Eye, EyeOff, TrendingUp, TrendingDown,
  Copy, CheckCircle, ArrowUpRight, AlertTriangle, ChevronRight, CreditCard, LogOut, Users,
} from "lucide-react";
import SendMoneyModal from "@/components/xpressbank/SendMoneyModal";
import { api, type Transaction, type User as UserType } from "@/lib/api";
import { formatCurrency, formatRelativeTime } from "@/lib/formatters";

const SPENDING_COLORS: Record<string, string> = {
  food: "#2D6A4F", shopping: "#D97706", transport: "#6366F1",
  utilities: "#94A3B8", transfer: "#0EA5E9", salary: "#10B981", rent: "#F43F5E",
};

function SpendingDonut({ transactions }: { transactions: Transaction[] }) {
  const sent = transactions.filter((t) => t.type === "sent");
  const totals: Record<string, number> = {};
  sent.forEach((t) => { totals[t.category] = (totals[t.category] || 0) + t.amount; });
  const total = Object.values(totals).reduce((a, b) => a + b, 0) || 1;
  const segments = Object.entries(totals).map(([label, amt]) => ({ label, pct: Math.round((amt / total) * 100), color: SPENDING_COLORS[label] || "#94A3B8" }));
  const size = 100; const r = 34; const cx = 50; const cy = 50; const circ = 2 * Math.PI * r;
  let offset = 0;
  const segs = segments.map((s) => { const dash = (s.pct / 100) * circ; const seg = { ...s, dash, offset }; offset += dash; return seg; });
  return (
    <div className="flex items-center gap-4">
      <svg width={size} height={size} className="shrink-0">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#F0EDE8" strokeWidth={12} />
        {segs.map((s) => (
          <circle key={s.label} cx={cx} cy={cy} r={r} fill="none" stroke={s.color} strokeWidth={12}
            strokeDasharray={`${s.dash} ${circ - s.dash}`} strokeDashoffset={-s.offset} strokeLinecap="butt"
            style={{ transform: "rotate(-90deg)", transformOrigin: "50% 50%" }} />
        ))}
      </svg>
      <div className="flex flex-col gap-1.5">
        {segs.slice(0, 4).map((s) => (
          <div key={s.label} className="flex items-center gap-2 text-xs text-slate-600">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s.color }} />
            <span className="capitalize">{s.label}</span>
            <span className="text-slate-400 ml-auto pl-3">{s.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function XpressBankDashboard() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<UserType | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [showSend, setShowSend] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [userData, txData, notifData] = await Promise.all([
        api.getUser(),
        api.getTransactions({ limit: 20 }),
        api.getNotifications(),
      ]);
      setUser(userData);
      setTransactions(txData);
      setUnreadCount(notifData.filter((n) => !n.read).length);
      // Sync balance to localStorage
      const stored = localStorage.getItem("xb_user");
      if (stored) {
        const parsed = JSON.parse(stored);
        localStorage.setItem("xb_user", JSON.stringify({ ...parsed, balance: userData.balance }));
      }
    } catch { /* show stale data */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem("xb_loggedIn") !== "true") {
      router.replace("/xpressbank/login"); return;
    }
    // Optimistic: show localStorage data immediately
    const stored = localStorage.getItem("xb_user");
    if (stored) { try { setUser(JSON.parse(stored)); } catch {} }
    loadData();
  }, [router, loadData]);

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(null), 3500); }
  function logout() { localStorage.clear(); router.push("/xpressbank/login"); }
  function copyUpi() { if (user) { navigator.clipboard.writeText(user.upiId); setCopied(true); setTimeout(() => setCopied(false), 1500); } }

  const firstName = user?.name.split(" ")[0] ?? "...";
  const initials = user?.avatarInitials ?? "RK";
  const balance = user?.balance ?? 0;

  // Monthly spend from transactions
  const thisMonth = new Date().getMonth();
  const monthlySpend = transactions
    .filter((t) => t.type === "sent" && new Date(t.timestamp).getMonth() === thisMonth)
    .reduce((s, t) => s + t.amount, 0);

  const recentFive = transactions.slice(0, 5);

  return (
    <div className="min-h-screen bg-[#F7F6F2] flex flex-col">
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-slate-800 text-white text-sm px-5 py-3 rounded-2xl shadow-lg whitespace-nowrap">{toast}</div>
      )}
      {showSend && (
        <SendMoneyModal
          onClose={() => setShowSend(false)}
          onSuccess={(newBalance) => {
            setShowSend(false);
            if (newBalance !== undefined && user) setUser({ ...user, balance: newBalance });
            loadData();
            showToast("✅ Transaction initiated successfully");
          }}
          onFraudPrevented={() => { setShowSend(false); showToast("🛡️ Fraud prevented — your money is safe!"); }}
        />
      )}

      {/* ── Desktop top navbar ── */}
      <header className="hidden sm:flex bg-white border-b border-stone-100 px-8 py-3.5 items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#2D6A4F] flex items-center justify-center"><Zap className="w-4 h-4 text-white" /></div>
          <span className="font-bold text-slate-800">XpressBank</span>
          <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-100 px-3 py-1 text-xs text-[#2D6A4F] font-medium ml-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Fraud Protection Active
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-500">Welcome, <span className="font-semibold text-slate-700">{user?.name ?? "..."}</span></span>
          <Link href="/xpressbank/contacts" className="text-slate-500 hover:text-slate-700 transition-colors text-sm flex items-center gap-1"><Users className="w-4 h-4" /> Contacts</Link>
          <Link href="/xpressbank/transactions" className="text-slate-500 hover:text-slate-700 transition-colors text-sm flex items-center gap-1"><Receipt className="w-4 h-4" /> Transactions</Link>
          <Link href="/xpressbank/notifications" className="relative text-slate-400 hover:text-slate-600">
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">{unreadCount}</span>}
          </Link>
          <Link href="/xpressbank/profile"><div className="w-8 h-8 rounded-full bg-[#2D6A4F] flex items-center justify-center text-white text-xs font-bold">{initials}</div></Link>
          <button onClick={logout} className="text-xs text-slate-400 hover:text-red-500 transition-colors flex items-center gap-1"><LogOut className="w-3.5 h-3.5" /> Logout</button>
        </div>
      </header>

      {/* ── Desktop content ── */}
      <div className="hidden sm:flex flex-1 flex-col">
        <main className="flex-1 p-8 flex flex-col gap-6 max-w-6xl mx-auto w-full">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Good morning, {firstName} 👋</h1>
              <p className="text-slate-500 text-sm mt-0.5">Here's your financial overview</p>
            </div>
            <span className="text-sm text-slate-400">{new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</span>
          </div>

          {/* Balance cards */}
          <div className="grid grid-cols-3 gap-5">
            <div className="bg-[#2D6A4F] rounded-2xl p-6 text-white flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-emerald-100 text-xs font-medium">Total Balance</span>
                <button onClick={() => setBalanceVisible((v) => !v)} className="text-emerald-200 hover:text-white">{balanceVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}</button>
              </div>
              <p className="text-3xl font-black tracking-tight">{loading ? "..." : balanceVisible ? formatCurrency(balance) : "••••••"}</p>
              <div className="flex items-center gap-1 text-emerald-100 text-xs"><TrendingUp className="w-3.5 h-3.5" /> Savings Account</div>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-stone-100 shadow-sm flex flex-col gap-3">
              <div className="flex items-center gap-2 text-slate-500 text-xs font-medium"><TrendingDown className="w-3.5 h-3.5" /> Monthly Spend</div>
              <p className="text-2xl font-bold text-slate-800">{balanceVisible ? formatCurrency(monthlySpend) : "••••••"}</p>
              <span className="inline-flex items-center rounded-full bg-amber-50 border border-amber-100 text-amber-700 px-2.5 py-0.5 text-xs font-medium w-fit">This month</span>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-stone-100 shadow-sm flex flex-col gap-3">
              <div className="flex items-center gap-2 text-slate-500 text-xs font-medium"><CreditCard className="w-3.5 h-3.5" /> Savings Goal</div>
              <p className="text-2xl font-bold text-slate-800">{balanceVisible ? formatCurrency(Math.round(balance * 0.3)) : "••••••"}</p>
              <span className="inline-flex items-center rounded-full bg-emerald-50 border border-emerald-100 text-[#2D6A4F] px-2.5 py-0.5 text-xs font-medium w-fit">30% of balance</span>
            </div>
          </div>

          {/* Quick actions */}
          <div className="grid grid-cols-4 gap-4">
            {[
              { icon: <Send className="w-5 h-5" />, label: "Send Money", bg: "bg-[#2D6A4F]/10 text-[#2D6A4F]", action: () => setShowSend(true) },
              { icon: <ArrowDownLeft className="w-5 h-5" />, label: "Request Money", bg: "bg-indigo-50 text-indigo-600", action: () => showToast("Request Money — demo mode") },
              { icon: <QrCode className="w-5 h-5" />, label: "Scan & Pay", bg: "bg-amber-50 text-amber-600", action: () => showToast("Scan QR — demo mode") },
              { icon: <FileText className="w-5 h-5" />, label: "Statements", bg: "bg-slate-100 text-slate-600", action: () => router.push("/xpressbank/transactions") },
            ].map((a) => (
              <button key={a.label} onClick={a.action} className="bg-white rounded-2xl p-5 border border-stone-100 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all flex flex-col items-center gap-3">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${a.bg}`}>{a.icon}</div>
                <span className="text-xs font-semibold text-slate-700">{a.label}</span>
              </button>
            ))}
          </div>

          {/* Main grid */}
          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2 bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-stone-50">
                <h2 className="text-sm font-bold text-slate-800">Recent Activity</h2>
                <Link href="/xpressbank/transactions" className="text-xs text-[#2D6A4F] hover:underline flex items-center gap-0.5">View All <ChevronRight className="w-3.5 h-3.5" /></Link>
              </div>
              <div className="divide-y divide-stone-50">
                {recentFive.map((tx) => (
                  <div key={tx.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-stone-50 transition-colors">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${tx.type === "received" ? "bg-emerald-50 text-emerald-600" : tx.status === "blocked" ? "bg-red-50 text-red-500" : "bg-stone-100 text-slate-500"}`}>
                      {tx.type === "received" ? <ArrowDownLeft className="w-4 h-4" /> : tx.status === "blocked" ? <AlertTriangle className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{tx.type === "received" ? tx.senderName : tx.recipientName}</p>
                      <p className="text-xs text-slate-400 font-mono truncate">{tx.type === "received" ? tx.senderUpi : tx.recipientUpi}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-sm font-bold ${tx.type === "received" ? "text-emerald-600" : tx.status === "blocked" ? "text-red-500 line-through" : "text-slate-700"}`}>
                        {tx.type === "received" ? "+" : "-"}{formatCurrency(tx.amount)}
                      </p>
                      <p className="text-xs text-slate-400">{formatRelativeTime(tx.timestamp)}</p>
                    </div>
                    <div className="shrink-0 ml-2">
                      {tx.status === "blocked"
                        ? <span className="inline-flex items-center gap-1 rounded-full bg-red-50 border border-red-200 text-red-600 px-2 py-0.5 text-xs font-medium"><Shield className="w-3 h-3" /> Blocked</span>
                        : <span className="inline-flex items-center rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 px-2 py-0.5 text-xs font-medium">✓</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-4">
              <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5 flex flex-col gap-4">
                <h2 className="text-sm font-bold text-slate-800">Spending Insights</h2>
                <SpendingDonut transactions={transactions} />
              </div>
              <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5 flex flex-col gap-3">
                <h2 className="text-sm font-bold text-slate-800">Your UPI ID</h2>
                <div className="flex items-center justify-between rounded-xl bg-stone-50 border border-stone-100 px-3 py-2.5">
                  <span className="text-xs font-mono text-slate-700 truncate">{user?.upiId ?? "..."}</span>
                  <button onClick={copyUpi} className="text-slate-400 hover:text-[#2D6A4F] transition-colors shrink-0 ml-2">
                    {copied ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* ── Mobile layout ── */}
      <div className="sm:hidden flex flex-col flex-1">
        <div className="bg-[#2D6A4F] px-5 pt-10 pb-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-white/20 flex items-center justify-center"><Zap className="w-3.5 h-3.5 text-white" /></div>
              <span className="font-bold text-white text-sm">XpressBank</span>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/xpressbank/notifications" className="relative text-white/70">
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">{unreadCount}</span>}
              </Link>
              <Link href="/xpressbank/profile"><div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white text-xs font-bold">{initials}</div></Link>
            </div>
          </div>
          <p className="text-emerald-200 text-sm">Good morning 👋</p>
          <h1 className="text-white text-xl font-bold mt-0.5">{firstName}</h1>
          <div className="mt-4 bg-white/10 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-emerald-200 text-xs font-medium">Total Balance</span>
              <button onClick={() => setBalanceVisible((v) => !v)} className="text-emerald-200">{balanceVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}</button>
            </div>
            <p className="text-white text-3xl font-black tracking-tight">{loading ? "..." : balanceVisible ? formatCurrency(balance) : "••••••"}</p>
            <div className="flex items-center gap-1 mt-1.5 text-emerald-200 text-xs"><TrendingUp className="w-3.5 h-3.5" /> Savings Account</div>
            <div className="grid grid-cols-2 gap-2 mt-3">
              <div className="bg-white/10 rounded-xl px-3 py-2"><p className="text-emerald-200 text-xs">Monthly Spend</p><p className="text-white font-bold text-sm mt-0.5">{balanceVisible ? formatCurrency(monthlySpend) : "••••"}</p></div>
              <div className="bg-white/10 rounded-xl px-3 py-2"><p className="text-emerald-200 text-xs">Savings Goal</p><p className="text-white font-bold text-sm mt-0.5">{balanceVisible ? formatCurrency(Math.round(balance * 0.3)) : "••••"}</p></div>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-3"><span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" /><span className="text-emerald-200 text-xs">Fraud protection active</span></div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 pb-24 flex flex-col gap-4">
          <div className="grid grid-cols-4 gap-2">
            {[
              { icon: <Send className="w-5 h-5" />, label: "Send", bg: "bg-[#2D6A4F] text-white", action: () => setShowSend(true) },
              { icon: <ArrowDownLeft className="w-5 h-5" />, label: "Request", bg: "bg-white text-indigo-600", action: () => showToast("Request Money — demo") },
              { icon: <QrCode className="w-5 h-5" />, label: "Scan", bg: "bg-white text-amber-600", action: () => showToast("Scan QR — demo") },
              { icon: <FileText className="w-5 h-5" />, label: "History", bg: "bg-white text-slate-600", action: () => router.push("/xpressbank/transactions") },
            ].map((a) => (
              <button key={a.label} onClick={a.action} className="flex flex-col items-center gap-2 active:scale-95 transition-transform">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm ${a.bg}`}>{a.icon}</div>
                <span className="text-xs font-medium text-slate-600">{a.label}</span>
              </button>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-stone-100 shadow-sm px-4 py-3 flex items-center justify-between">
            <div><p className="text-xs text-slate-400 font-medium">Your UPI ID</p><p className="text-sm font-mono font-semibold text-slate-800 mt-0.5">{user?.upiId ?? "..."}</p></div>
            <button onClick={copyUpi} className="w-9 h-9 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-center text-slate-400">
              {copied ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-stone-50">
              <h2 className="text-sm font-bold text-slate-800">Recent Activity</h2>
              <Link href="/xpressbank/transactions" className="text-xs text-[#2D6A4F] flex items-center gap-0.5">View All <ChevronRight className="w-3.5 h-3.5" /></Link>
            </div>
            <div className="divide-y divide-stone-50">
              {recentFive.map((tx) => (
                <div key={tx.id} className="flex items-center gap-3 px-4 py-3 active:bg-stone-50 transition-colors">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${tx.type === "received" ? "bg-emerald-50 text-emerald-600" : tx.status === "blocked" ? "bg-red-50 text-red-500" : "bg-stone-100 text-slate-500"}`}>
                    {tx.type === "received" ? <ArrowDownLeft className="w-4 h-4" /> : tx.status === "blocked" ? <AlertTriangle className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{tx.type === "received" ? tx.senderName : tx.recipientName}</p>
                    <p className="text-xs text-slate-400 font-mono truncate">{tx.type === "received" ? tx.senderUpi : tx.recipientUpi}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-sm font-bold ${tx.type === "received" ? "text-emerald-600" : tx.status === "blocked" ? "text-red-500" : "text-slate-700"}`}>
                      {tx.type === "received" ? "+" : "-"}{formatCurrency(tx.amount)}
                    </p>
                    <p className="text-xs text-slate-400">{formatRelativeTime(tx.timestamp)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-4">
            <h2 className="text-sm font-bold text-slate-800 mb-3">Spending Insights</h2>
            <SpendingDonut transactions={transactions} />
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-stone-100 flex items-center justify-around px-2 py-2 z-30 safe-area-bottom">
          {[
            { icon: <Home className="w-5 h-5" />, label: "Home", href: "/xpressbank/dashboard" },
            { icon: <Receipt className="w-5 h-5" />, label: "History", href: "/xpressbank/transactions" },
            { icon: <Send className="w-5 h-5" />, label: "Send", href: "#" },
            { icon: <Users className="w-5 h-5" />, label: "Contacts", href: "/xpressbank/contacts" },
            { icon: <User className="w-5 h-5" />, label: "Profile", href: "/xpressbank/profile" },
          ].map((item) => (
            <Link key={item.label} href={item.href}
              onClick={item.label === "Send" ? (e) => { e.preventDefault(); setShowSend(true); } : undefined}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors ${pathname === item.href ? "text-[#2D6A4F] bg-[#2D6A4F]/10" : "text-slate-400"}`}
            >
              {item.icon}
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
