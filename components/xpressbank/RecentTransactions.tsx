import Link from "next/link";
import { ArrowUpRight, ArrowDownLeft, AlertTriangle, ShieldAlert } from "lucide-react";

export interface TxItem {
  id: number;
  type: "sent" | "received" | "blocked";
  name: string;
  upi: string;
  amount: number;
  date: string;
  status: "Success" | "Pending" | "Blocked";
}

export const MOCK_TRANSACTIONS: TxItem[] = [
  { id: 1, type: "received", name: "Salary Credit", upi: "corp@hdfcbank", amount: 45000, date: "Apr 1, 2026", status: "Success" },
  { id: 2, type: "sent", name: "Kiran Stores", upi: "kiran@okhdfc", amount: 850, date: "Apr 3, 2026", status: "Success" },
  { id: 3, type: "sent", name: "Electricity Bill", upi: "billing@paytm", amount: 1200, date: "Apr 5, 2026", status: "Success" },
  { id: 4, type: "received", name: "Rahul Verma", upi: "rahul@okicici", amount: 5000, date: "Apr 7, 2026", status: "Success" },
  { id: 5, type: "blocked", name: "Scammer Alert Test", upi: "scammer@okhdfcbank", amount: 25000, date: "Apr 11, 2026", status: "Blocked" },
];

const fmt = (n: number) => "₹" + n.toLocaleString("en-IN");

function StatusBadge({ status }: { status: TxItem["status"] }) {
  if (status === "Blocked") return (
    <span className="inline-flex items-center gap-1 rounded-full bg-red-50 border border-red-200 text-red-600 px-2 py-0.5 text-xs font-medium">
      <ShieldAlert className="w-3 h-3" /> Blocked
    </span>
  );
  if (status === "Pending") return (
    <span className="inline-flex items-center rounded-full bg-amber-50 border border-amber-200 text-amber-600 px-2 py-0.5 text-xs font-medium">Pending</span>
  );
  return (
    <span className="inline-flex items-center rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 px-2 py-0.5 text-xs font-medium">Success</span>
  );
}

export default function RecentTransactions({ transactions = MOCK_TRANSACTIONS }: { transactions?: TxItem[] }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-50">
        <h2 className="text-sm font-bold text-slate-800">Recent Transactions</h2>
        <Link href="/xpressbank/transactions" className="text-xs text-blue-600 hover:text-blue-700 transition-colors">
          View All →
        </Link>
      </div>
      <div className="divide-y divide-slate-50">
        {transactions.map((tx) => (
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
            <div className="shrink-0 ml-1">
              <StatusBadge status={tx.status} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
