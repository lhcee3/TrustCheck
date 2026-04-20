"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Search, ArrowUpRight, ArrowDownLeft, AlertTriangle,
  Shield, Loader2, Zap, Bell, Receipt, Users, LogOut,
} from "lucide-react";
import { api, type Transaction } from "@/lib/api";
import { formatCurrency, formatRelativeTime } from "@/lib/formatters";

type Filter = "all" | "sent" | "received" | "blocked";

const CAT_COLORS: Record<string, string> = {
  food: "bg-orange-50 text-orange-600", shopping: "bg-purple-50 text-purple-600",
  transport: "bg-blue-50 text-blue-600", utilities: "bg-slate-100 text-slate-600",
  transfer: "bg-indigo-50 text-indigo-600", salary: "bg-emerald-50 text-emerald-600",
  rent: "bg-rose-50 text-rose-600",
};

function TxRow({ tx, desktop }: { tx: Transaction; desktop?: boolean }) {
  const isReceived = tx.type === "received";
  const isBlocked = tx.status === "blocked";
  return (
    <div className={`flex items-center gap-3 ${desktop ? "px-5 py-3.5 hover:bg-stone-50" : "px-4 py-4 active:bg-stone-50"} transition-colors`}>
      <div className={`${desktop ? "w-9 h-9" : "w-10 h-10"} rounded-xl flex items-center justify-center shrink-0 ${isReceived ? "bg-emerald-50 text-emerald-600" : isBlocked ? "bg-red-50 text-red-500" : "bg-stone-100 text-slate-500"}`}>
        {isReceived ? <ArrowDownLeft className="w-4 h-4" /> : isBlocked ? <AlertTriangle className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-800 truncate">{isReceived ? tx.senderName : tx.recipientName}</p>
        <p className="text-xs text-slate-400 font-mono truncate">{isReceived ? tx.senderUpi : tx.recipientUpi}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${CAT_COLORS[tx.category] ?? "bg-slate-100 text-slate-600"}`}>{tx.category}</span>
          <span className="text-xs text-slate-400">{formatRelativeTime(tx.timestamp)}</span>
        </div>
      </div>
      <div className="text-right shrink-0 flex flex-col items-end gap-1">
        <p className={`text-sm font-bold ${isReceived ? "text-emerald-600" : isBlocked ? "text-red-500 line-through" : "text-slate-700"}`}>
          {isReceived ? "+" : "-"}{formatCurrency(tx.amount)}
        </p>
        {isBlocked
          ? <span className="inline-flex items-center gap-1 rounded-full bg-red-50 border border-red-200 text-red-600 px-2 py-0.5 text-xs font-medium"><Shield className="w-3 h-3" /> Blocked</span>
          : <span className="inline-flex items-center rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 px-2 py-0.5 text-xs font-medium">✓</span>}
      </div>
    </div>
  );
}

const SESSION_KEY = "xb_session_txns";

function getSessionTxns(): Transaction[] {
  try {
    return JSON.parse(sessionStorage.getItem(SESSION_KEY) ?? "[]") as Transaction[];
  } catch { return []; }
}

export default function TransactionsPage() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function load(s: string, f: Filter) {
    setLoading(true);
    try {
      const type = f === "all" ? undefined : f;
      const apiData = await api.getTransactions({ type, search: s || undefined });
      // Merge session transactions (this session's attempts) with API data
      const sessionTxns = getSessionTxns().filter((t) => {
        if (type && t.type !== type && t.status !== type) return false;
        if (s) {
          const q = s.toLowerCase();
          return t.recipientName?.toLowerCase().includes(q) ||
            t.recipientUpi?.toLowerCase().includes(q) ||
            t.note?.toLowerCase().includes(q);
        }
        return true;
      });
      // Deduplicate — session txns take priority, remove dupes from API
      const sessionIds = new Set(sessionTxns.map((t) => t.id));
      const merged = [...sessionTxns, ...apiData.filter((t) => !sessionIds.has(t.id))];
      setTransactions(merged);
    } catch { /* keep stale */ }
    finally { setLoading(false); }
  }

  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem("xb_loggedIn") !== "true") {
      router.replace("/xpressbank/login"); return;
    }
    load("", "all");
  }, [router]);

  function handleSearch(val: string) {
    setSearch(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => load(val, filter), 300);
  }

  function handleFilter(f: Filter) {
    setFilter(f);
    load(search, f);
  }

  function logout() { localStorage.clear(); router.push("/xpressbank/login"); }

  const sent = transactions.filter((t) => t.type === "sent").reduce((s, t) => s + t.amount, 0);
  const received = transactions.filter((t) => t.type === "received").reduce((s, t) => s + t.amount, 0);
  const blocked = transactions.filter((t) => t.status === "blocked").length;

  return (
    <div className="min-h-screen bg-[#F7F6F2] flex flex-col">

      {/* ── Desktop layout ── */}
      <div className="hidden sm:flex flex-col flex-1">
        <header className="bg-white border-b border-stone-100 px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#2D6A4F] flex items-center justify-center"><Zap className="w-4 h-4 text-white" /></div>
            <span className="font-bold text-slate-800">XpressBank</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/xpressbank/contacts" className="text-slate-500 hover:text-slate-700 text-sm flex items-center gap-1"><Users className="w-4 h-4" /> Contacts</Link>
            <Link href="/xpressbank/transactions" className="text-[#2D6A4F] font-semibold text-sm flex items-center gap-1"><Receipt className="w-4 h-4" /> Transactions</Link>
            <Link href="/xpressbank/notifications" className="text-slate-400 hover:text-slate-600"><Bell className="w-5 h-5" /></Link>
            <Link href="/xpressbank/profile" className="w-8 h-8 rounded-full bg-[#2D6A4F] flex items-center justify-center text-white text-xs font-bold">RK</Link>
            <button onClick={logout} className="text-xs text-slate-400 hover:text-red-500 flex items-center gap-1"><LogOut className="w-3.5 h-3.5" /> Logout</button>
          </div>
        </header>

        <main className="flex-1 p-8 max-w-6xl mx-auto w-full flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Transactions</h1>
              <p className="text-slate-500 text-sm mt-0.5">Your complete payment history</p>
            </div>
            <span className="text-sm text-slate-400">{transactions.length} transactions</span>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-5">
            <div className="bg-white rounded-2xl p-5 border border-stone-100 shadow-sm flex flex-col gap-1">
              <span className="text-xs text-slate-500 font-medium">Total Sent</span>
              <p className="text-2xl font-bold text-slate-800">{formatCurrency(sent)}</p>
              <span className="text-xs text-slate-400">{transactions.filter((t) => t.type === "sent").length} payments</span>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-stone-100 shadow-sm flex flex-col gap-1">
              <span className="text-xs text-slate-500 font-medium">Total Received</span>
              <p className="text-2xl font-bold text-emerald-600">{formatCurrency(received)}</p>
              <span className="text-xs text-slate-400">{transactions.filter((t) => t.type === "received").length} credits</span>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-stone-100 shadow-sm flex flex-col gap-1">
              <span className="text-xs text-slate-500 font-medium">Blocked by TrustCheck</span>
              <p className="text-2xl font-bold text-red-500">{blocked}</p>
              <span className="text-xs text-slate-400">fraud attempts stopped</span>
            </div>
          </div>

          {/* Search + filters + table */}
          <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden flex flex-col">
            <div className="flex items-center gap-4 px-5 py-4 border-b border-stone-50">
              <div className="flex items-center gap-2 flex-1 rounded-xl bg-stone-50 border border-stone-200 px-3 py-2">
                <Search className="w-4 h-4 text-slate-400 shrink-0" />
                <input placeholder="Search by name, UPI, note..." value={search} onChange={(e) => handleSearch(e.target.value)}
                  className="bg-transparent text-sm text-slate-700 placeholder-slate-400 focus:outline-none w-full" />
              </div>
              <div className="flex gap-2">
                {(["all", "sent", "received", "blocked"] as Filter[]).map((f) => (
                  <button key={f} onClick={() => handleFilter(f)}
                    className={`rounded-xl px-4 py-2 text-xs font-semibold capitalize transition-colors ${filter === f ? "bg-[#2D6A4F] text-white" : "bg-stone-50 border border-stone-200 text-slate-600 hover:bg-stone-100"}`}>
                    {f}
                  </button>
                ))}
              </div>
            </div>
            {loading ? (
              <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-[#2D6A4F]" /></div>
            ) : transactions.length === 0 ? (
              <p className="text-center text-slate-400 text-sm py-16">No transactions found</p>
            ) : (
              <div className="divide-y divide-stone-50">
                {transactions.map((tx) => <TxRow key={tx.id} tx={tx} desktop />)}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* ── Mobile layout (unchanged) ── */}
      <div className="sm:hidden flex flex-col flex-1">
        <div className="bg-white border-b border-stone-100 px-4 pt-4 pb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/xpressbank/dashboard" className="w-9 h-9 rounded-xl bg-stone-100 flex items-center justify-center text-slate-600"><ArrowLeft className="w-4 h-4" /></Link>
            <h1 className="text-base font-bold text-slate-800">Transactions</h1>
          </div>
          <span className="text-xs text-slate-400">Showing {transactions.length}</span>
        </div>

        <div className="flex-1 px-4 py-4 pb-8 flex flex-col gap-3">
          <div className="flex items-center gap-2 rounded-2xl bg-white border border-stone-200 px-4 py-3">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input placeholder="Search by name, UPI, note..." value={search} onChange={(e) => handleSearch(e.target.value)}
              className="bg-transparent text-sm text-slate-700 placeholder-slate-400 focus:outline-none w-full" />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {(["all", "sent", "received", "blocked"] as Filter[]).map((f) => (
              <button key={f} onClick={() => handleFilter(f)}
                className={`rounded-xl px-4 py-2 text-xs font-semibold capitalize whitespace-nowrap transition-colors ${filter === f ? "bg-[#2D6A4F] text-white" : "bg-white border border-stone-200 text-slate-600"}`}>
                {f}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-[#2D6A4F]" /></div>
          ) : transactions.length === 0 ? (
            <p className="text-center text-slate-400 text-sm py-16">No transactions found</p>
          ) : (
            <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
              <div className="divide-y divide-stone-50">
                {transactions.map((tx) => <TxRow key={tx.id} tx={tx} />)}
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
