"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Search, Download, ArrowUpRight, ArrowDownLeft, AlertTriangle, ShieldAlert } from "lucide-react";

const ALL_TRANSACTIONS = [
  { id: 1, type: "received", name: "Salary Credit", upi: "corp@hdfcbank", amount: 45000, date: "Apr 1, 2026", status: "Success", category: "Income" },
  { id: 2, type: "sent", name: "Kiran Stores", upi: "kiran@okhdfc", amount: 850, date: "Apr 3, 2026", status: "Success", category: "Shopping" },
  { id: 3, type: "sent", name: "Electricity Bill", upi: "billing@paytm", amount: 1200, date: "Apr 5, 2026", status: "Success", category: "Bills" },
  { id: 4, type: "received", name: "Rahul Verma", upi: "rahul@okicici", amount: 5000, date: "Apr 7, 2026", status: "Success", category: "Transfer" },
  { id: 5, type: "sent", name: "Amazon Pay", upi: "amazon@apl", amount: 3499, date: "Apr 8, 2026", status: "Success", category: "Shopping" },
  { id: 6, type: "sent", name: "Swiggy Order", upi: "swiggy@icici", amount: 420, date: "Apr 9, 2026", status: "Success", category: "Food" },
  { id: 7, type: "sent", name: "Airtel Recharge", upi: "airtel@axis", amount: 599, date: "Apr 10, 2026", status: "Success", category: "Bills" },
  { id: 8, type: "blocked", name: "Scammer Alert Test", upi: "scammer@okhdfcbank", amount: 25000, date: "Apr 11, 2026", status: "Blocked", category: "Blocked" },
  { id: 9, type: "sent", name: "Netflix Subscription", upi: "netflix@icici", amount: 649, date: "Apr 11, 2026", status: "Success", category: "Entertainment" },
  { id: 10, type: "received", name: "Freelance Payment", upi: "client@okhdfc", amount: 12000, date: "Apr 12, 2026", status: "Success", category: "Income" },
  { id: 11, type: "sent", name: "Zomato Order", upi: "zomato@axis", amount: 380, date: "Apr 12, 2026", status: "Success", category: "Food" },
  { id: 12, type: "sent", name: "Water Bill", upi: "water@paytm", amount: 450, date: "Apr 13, 2026", status: "Success", category: "Bills" },
  { id: 13, type: "sent", name: "Gym Membership", upi: "gym@okicici", amount: 1500, date: "Apr 13, 2026", status: "Success", category: "Health" },
  { id: 14, type: "received", name: "Cashback Reward", upi: "rewards@hdfcbank", amount: 250, date: "Apr 14, 2026", status: "Success", category: "Income" },
  { id: 15, type: "sent", name: "Petrol Station", upi: "petrol@okaxis", amount: 2000, date: "Apr 14, 2026", status: "Success", category: "Transport" },
];

const fmt = (n: number) => "₹" + n.toLocaleString("en-IN");
type Filter = "all" | "sent" | "received" | "blocked";

export default function TransactionsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem("xb_loggedIn") !== "true") {
      router.replace("/xpressbank/login");
    }
  }, [router]);

  const filtered = ALL_TRANSACTIONS.filter((tx) => {
    const matchSearch = tx.name.toLowerCase().includes(search.toLowerCase()) ||
      tx.upi.toLowerCase().includes(search.toLowerCase()) ||
      String(tx.amount).includes(search);
    const matchFilter = filter === "all" || tx.type === filter;
    return matchSearch && matchFilter;
  });

  function exportCSV() {
    setToast("📥 Export feature — would download CSV in production");
    setTimeout(() => setToast(null), 3000);
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-slate-800 text-white text-sm px-5 py-3 rounded-2xl shadow-lg">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-slate-100 px-4 sm:px-8 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/xpressbank/dashboard" className="text-slate-400 hover:text-slate-600 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-base font-bold text-slate-800">Transaction History</h1>
        </div>
        <button
          onClick={exportCSV}
          className="flex items-center gap-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors px-4 py-2 text-xs font-medium text-slate-600"
        >
          <Download className="w-3.5 h-3.5" /> Export CSV
        </button>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-8 py-6 flex flex-col gap-4">
        {/* Search */}
        <div className="flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-4 py-2.5">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            placeholder="Search by name, UPI ID or amount..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent text-sm text-slate-700 placeholder-slate-400 focus:outline-none w-full"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2 flex-wrap">
          {(["all", "sent", "received", "blocked"] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-xl px-4 py-1.5 text-xs font-medium capitalize transition-colors ${
                filter === f ? "bg-blue-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="divide-y divide-slate-50">
            {filtered.length === 0 ? (
              <p className="text-center text-slate-400 text-sm py-10">No transactions found</p>
            ) : filtered.map((tx) => (
              <div key={tx.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 transition-colors">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  tx.type === "received" ? "bg-emerald-50 text-emerald-600" :
                  tx.type === "blocked" ? "bg-red-50 text-red-500" :
                  "bg-slate-100 text-slate-500"
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
                  {tx.status === "Blocked"
                    ? <span className="inline-flex items-center gap-1 rounded-full bg-red-50 border border-red-200 text-red-600 px-2 py-0.5 text-xs font-medium"><ShieldAlert className="w-3 h-3" /> Blocked</span>
                    : <span className="inline-flex items-center rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 px-2 py-0.5 text-xs font-medium">Success</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
