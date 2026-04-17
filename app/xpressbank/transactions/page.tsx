"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Search, ArrowUpRight, ArrowDownLeft, AlertTriangle, Shield, Loader2 } from "lucide-react";
import { api, type Transaction } from "@/lib/api";
import { formatCurrency, formatRelativeTime } from "@/lib/formatters";

type Filter = "all" | "sent" | "received" | "blocked";

const CAT_COLORS: Record<string, string> = {
  food: "bg-orange-50 text-orange-600", shopping: "bg-purple-50 text-purple-600",
  transport: "bg-blue-50 text-blue-600", utilities: "bg-slate-100 text-slate-600",
  transfer: "bg-indigo-50 text-indigo-600", salary: "bg-emerald-50 text-emerald-600",
  rent: "bg-rose-50 text-rose-600",
};

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
      const data = await api.getTransactions({ type, search: s || undefined });
      setTransactions(data);
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

  return (
    <div className="min-h-screen bg-[#F7F6F2] flex flex-col">
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
            className="bg-transparent text-sm text-slate-700 placeholder-slate-400 focus:outline-none w-full"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {(["all", "sent", "received", "blocked"] as Filter[]).map((f) => (
            <button key={f} onClick={() => handleFilter(f)}
              className={`rounded-xl px-4 py-2 text-xs font-semibold capitalize whitespace-nowrap transition-colors ${filter === f ? "bg-[#2D6A4F] text-white" : "bg-white border border-stone-200 text-slate-600"}`}
            >{f}</button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-[#2D6A4F]" /></div>
        ) : transactions.length === 0 ? (
          <p className="text-center text-slate-400 text-sm py-16">No transactions found</p>
        ) : (
          <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
            <div className="divide-y divide-stone-50">
              {transactions.map((tx) => (
                <div key={tx.id} className="flex items-center gap-3 px-4 py-4 active:bg-stone-50 transition-colors">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${tx.type === "received" ? "bg-emerald-50 text-emerald-600" : tx.status === "blocked" ? "bg-red-50 text-red-500" : "bg-stone-100 text-slate-500"}`}>
                    {tx.type === "received" ? <ArrowDownLeft className="w-4 h-4" /> : tx.status === "blocked" ? <AlertTriangle className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{tx.type === "received" ? tx.senderName : tx.recipientName}</p>
                    <p className="text-xs text-slate-400 font-mono truncate">{tx.type === "received" ? tx.senderUpi : tx.recipientUpi}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${CAT_COLORS[tx.category] ?? "bg-slate-100 text-slate-600"}`}>{tx.category}</span>
                      <span className="text-xs text-slate-400">{formatRelativeTime(tx.timestamp)}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0 flex flex-col items-end gap-1">
                    <p className={`text-sm font-bold ${tx.type === "received" ? "text-emerald-600" : tx.status === "blocked" ? "text-red-500 line-through" : "text-slate-700"}`}>
                      {tx.type === "received" ? "+" : "-"}{formatCurrency(tx.amount)}
                    </p>
                    {tx.status === "blocked"
                      ? <span className="inline-flex items-center gap-1 rounded-full bg-red-50 border border-red-200 text-red-600 px-2 py-0.5 text-xs font-medium"><Shield className="w-3 h-3" /> Blocked</span>
                      : <span className="inline-flex items-center rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 px-2 py-0.5 text-xs font-medium">✓</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
