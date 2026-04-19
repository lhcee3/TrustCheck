"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Bell, CheckCheck, Loader2,
  Zap, Receipt, Users, LogOut,
} from "lucide-react";
import { api, type Notification } from "@/lib/api";
import { formatRelativeTime } from "@/lib/formatters";

const TYPE_STYLES: Record<string, string> = {
  alert: "bg-red-50 border-red-100 text-red-600",
  transaction: "bg-emerald-50 border-emerald-100 text-emerald-600",
  system: "bg-blue-50 border-blue-100 text-blue-600",
};

export default function NotificationsPage() {
  const router = useRouter();
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem("xb_loggedIn") !== "true") {
      router.replace("/xpressbank/login"); return;
    }
    api.getNotifications().then(setNotifs).catch(() => {}).finally(() => setLoading(false));
  }, [router]);

  async function markAllRead() {
    const updated = await api.markAllNotificationsRead().catch(() => notifs);
    setNotifs(updated);
  }

  async function markRead(id: string) {
    await api.markNotificationRead(id).catch(() => {});
    setNotifs((n) => n.map((x) => x.id === id ? { ...x, read: true } : x));
  }

  function logout() { localStorage.clear(); router.push("/xpressbank/login"); }

  const unread = notifs.filter((n) => !n.read).length;

  const notifItem = (n: Notification, desktop?: boolean) => (
    <button key={n.id} onClick={() => markRead(n.id)}
      className={`w-full text-left bg-white rounded-2xl border ${desktop ? "p-5" : "p-4"} flex items-start gap-3 transition-colors ${n.read ? "border-stone-100 opacity-70" : "border-stone-200 shadow-sm"}`}>
      <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 text-base ${TYPE_STYLES[n.type] ?? "bg-slate-50 border-slate-100 text-slate-500"}`}>
        {n.type === "alert" ? "🚨" : n.type === "transaction" ? "💸" : "ℹ️"}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={`text-sm font-semibold ${n.read ? "text-slate-500" : "text-slate-800"}`}>{n.title}</p>
          {!n.read && <span className="w-2 h-2 rounded-full bg-[#2D6A4F] shrink-0 mt-1.5" />}
        </div>
        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{n.body}</p>
        <p className="text-xs text-slate-400 mt-1">{formatRelativeTime(n.timestamp)}</p>
      </div>
    </button>
  );

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
            <Link href="/xpressbank/transactions" className="text-slate-500 hover:text-slate-700 text-sm flex items-center gap-1"><Receipt className="w-4 h-4" /> Transactions</Link>
            <Link href="/xpressbank/notifications" className="relative text-[#2D6A4F]">
              <Bell className="w-5 h-5" />
              {unread > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">{unread}</span>}
            </Link>
            <Link href="/xpressbank/profile" className="w-8 h-8 rounded-full bg-[#2D6A4F] flex items-center justify-center text-white text-xs font-bold">RK</Link>
            <button onClick={logout} className="text-xs text-slate-400 hover:text-red-500 flex items-center gap-1"><LogOut className="w-3.5 h-3.5" /> Logout</button>
          </div>
        </header>

        <main className="flex-1 p-8 max-w-4xl mx-auto w-full flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Notifications</h1>
              <p className="text-slate-500 text-sm mt-0.5">{unread > 0 ? `${unread} unread` : "All caught up"}</p>
            </div>
            {unread > 0 && (
              <button onClick={markAllRead} className="flex items-center gap-1.5 text-sm text-[#2D6A4F] font-medium hover:underline">
                <CheckCheck className="w-4 h-4" /> Mark all read
              </button>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-[#2D6A4F]" /></div>
          ) : notifs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Bell className="w-10 h-10 text-slate-300" />
              <p className="text-slate-400 text-sm">No notifications yet</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {notifs.map((n) => notifItem(n, true))}
            </div>
          )}
        </main>
      </div>

      {/* ── Mobile layout (unchanged) ── */}
      <div className="sm:hidden flex flex-col flex-1">
        <div className="bg-white border-b border-stone-100 px-4 pt-4 pb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/xpressbank/dashboard" className="w-9 h-9 rounded-xl bg-stone-100 flex items-center justify-center text-slate-600"><ArrowLeft className="w-4 h-4" /></Link>
            <h1 className="text-base font-bold text-slate-800">Notifications</h1>
            {unread > 0 && <span className="rounded-full bg-red-500 text-white text-xs font-bold px-2 py-0.5">{unread}</span>}
          </div>
          {unread > 0 && (
            <button onClick={markAllRead} className="flex items-center gap-1.5 text-xs text-[#2D6A4F] font-medium">
              <CheckCheck className="w-4 h-4" /> Mark all read
            </button>
          )}
        </div>

        <div className="flex-1 px-4 py-4 pb-8 flex flex-col gap-2">
          {loading ? (
            <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-[#2D6A4F]" /></div>
          ) : notifs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Bell className="w-10 h-10 text-slate-300" />
              <p className="text-slate-400 text-sm">No notifications yet</p>
            </div>
          ) : notifs.map((n) => notifItem(n))}
        </div>
      </div>

    </div>
  );
}
