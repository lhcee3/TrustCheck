"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, BadgeCheck, LogOut, Bell, Copy, CheckCircle, CreditCard, Loader2 } from "lucide-react";
import { api, type User, type Transaction } from "@/lib/api";
import { formatCurrency } from "@/lib/formatters";

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button onClick={onToggle} className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ${on ? "bg-[#2D6A4F]" : "bg-slate-200"}`}>
      <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all duration-200 ${on ? "left-6" : "left-0.5"}`} />
    </button>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState({ total: 0, sent: 0, received: 0 });
  const [loading, setLoading] = useState(true);
  const [fraudEnabled, setFraudEnabled] = useState(true);
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [notifStatus, setNotifStatus] = useState<string>("default");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (localStorage.getItem("xb_loggedIn") !== "true") { router.replace("/xpressbank/login"); return; }
      if ("Notification" in window) setNotifStatus(Notification.permission);
    }
    Promise.all([api.getUser(), api.getTransactions()])
      .then(([userData, txData]) => {
        setUser(userData);
        const sent = txData.filter((t: Transaction) => t.type === "sent").reduce((s: number, t: Transaction) => s + t.amount, 0);
        const received = txData.filter((t: Transaction) => t.type === "received").reduce((s: number, t: Transaction) => s + t.amount, 0);
        setStats({ total: txData.length, sent, received });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [router]);

  async function requestNotifications() {
    if (!("Notification" in window)) return;
    const perm = await Notification.requestPermission();
    setNotifStatus(perm);
    if (perm === "granted") {
      const reg = await navigator.serviceWorker?.ready.catch(() => null);
      reg?.showNotification("✅ Alerts Enabled", { body: "You'll be notified instantly on fraud attempts.", icon: "/icon-192.png" });
    }
  }

  function copyUpi() { if (user) { navigator.clipboard.writeText(user.upiId); setCopied(true); setTimeout(() => setCopied(false), 1500); } }
  function logout() { localStorage.clear(); router.push("/xpressbank/login"); }

  if (loading) return (
    <div className="min-h-screen bg-[#F7F6F2] flex items-center justify-center">
      <Loader2 className="w-6 h-6 animate-spin text-[#2D6A4F]" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F7F6F2] flex flex-col">
      <div className="bg-white border-b border-stone-100 px-4 pt-4 pb-4 flex items-center gap-3">
        <Link href="/xpressbank/dashboard" className="w-9 h-9 rounded-xl bg-stone-100 flex items-center justify-center text-slate-600"><ArrowLeft className="w-4 h-4" /></Link>
        <h1 className="text-base font-bold text-slate-800">Profile</h1>
      </div>

      <div className="flex-1 px-4 py-5 pb-10 flex flex-col gap-4">
        {/* Avatar card */}
        <div className="bg-[#2D6A4F] rounded-2xl p-6 flex flex-col items-center gap-3 text-center">
          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-white text-2xl font-bold">{user?.avatarInitials ?? "RK"}</div>
          <div>
            <p className="font-bold text-white text-lg">{user?.name}</p>
            <div className="flex items-center justify-center gap-2 mt-1">
              <p className="text-emerald-200 text-xs font-mono">{user?.upiId}</p>
              <button onClick={copyUpi} className="text-emerald-200 hover:text-white transition-colors">
                {copied ? <CheckCircle className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 text-white px-3 py-1 text-xs font-medium">
            <BadgeCheck className="w-3.5 h-3.5" /> {user?.kycStatus === "verified" ? "KYC Verified" : "KYC Pending"}
          </span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Transactions", value: stats.total },
            { label: "Total Sent", value: formatCurrency(stats.sent) },
            { label: "Total Received", value: formatCurrency(stats.received) },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-2xl border border-stone-100 shadow-sm p-3 text-center">
              <p className="text-sm font-bold text-slate-800">{s.value}</p>
              <p className="text-xs text-slate-400 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Personal info */}
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-stone-50"><h2 className="text-sm font-bold text-slate-800">Personal Information</h2></div>
          {[
            { label: "Full Name", value: user?.name },
            { label: "Email", value: user?.email },
            { label: "Mobile", value: user?.phone },
            { label: "UPI ID", value: user?.upiId, mono: true },
            { label: "Account No.", value: user?.accountNumber, mono: true },
            { label: "IFSC", value: user?.ifsc, mono: true },
            { label: "Branch", value: user?.branch },
            { label: "Account Type", value: user?.accountType },
            { label: "Member Since", value: user?.joinedDate },
          ].map((row) => (
            <div key={row.label} className="flex items-center justify-between px-4 py-3 border-b border-stone-50 last:border-0">
              <span className="text-xs text-slate-500">{row.label}</span>
              <span className={`text-sm font-medium text-slate-700 ${row.mono ? "font-mono text-xs" : ""}`}>{row.value ?? "—"}</span>
            </div>
          ))}
        </div>

        {/* Linked cards */}
        {user?.linkedCards?.map((card) => (
          <div key={card.last4} className="bg-white rounded-2xl border border-stone-100 shadow-sm p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#2D6A4F]/10 flex items-center justify-center"><CreditCard className="w-5 h-5 text-[#2D6A4F]" /></div>
              <div>
                <p className="text-sm font-semibold text-slate-800">{card.network} ••••{card.last4}</p>
                <p className="text-xs text-slate-400">Expires {card.expiry}</p>
              </div>
            </div>
            <span className="text-xs text-emerald-600 font-medium">Active</span>
          </div>
        ))}

        {/* Security settings */}
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-stone-50"><h2 className="text-sm font-bold text-slate-800">Security & Alerts</h2></div>
          <div className="flex items-center justify-between px-4 py-4 border-b border-stone-50">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-[#2D6A4F]" />
              <div><p className="text-sm font-medium text-slate-700">Fraud Protection</p><p className="text-xs text-slate-400">AI checks every transaction</p></div>
            </div>
            <Toggle on={fraudEnabled} onToggle={() => setFraudEnabled((v) => !v)} />
          </div>
          <div className="flex items-center justify-between px-4 py-4 border-b border-stone-50">
            <div className="flex items-center gap-2.5">
              <Bell className="w-4 h-4 text-[#2D6A4F]" />
              <div><p className="text-sm font-medium text-slate-700">Risk Alerts</p><p className="text-xs text-slate-400">In-app fraud warnings</p></div>
            </div>
            <Toggle on={alertsEnabled} onToggle={() => setAlertsEnabled((v) => !v)} />
          </div>
          <div className="flex items-center justify-between px-4 py-4">
            <div className="flex items-center gap-2.5">
              <Bell className="w-4 h-4 text-amber-500" />
              <div>
                <p className="text-sm font-medium text-slate-700">Push Notifications</p>
                <p className="text-xs text-slate-400">{notifStatus === "granted" ? "✅ Active — alerts even when closed" : notifStatus === "denied" ? "❌ Blocked in browser settings" : "Get notified on fraud attempts"}</p>
              </div>
            </div>
            {notifStatus !== "granted" && notifStatus !== "denied" && (
              <button onClick={requestNotifications} className="rounded-xl bg-amber-50 border border-amber-200 text-amber-700 px-3 py-1.5 text-xs font-semibold">Enable</button>
            )}
            {notifStatus === "granted" && <span className="text-xs text-emerald-600 font-medium">Active</span>}
          </div>
        </div>

        <button onClick={logout} className="w-full rounded-2xl border border-red-200 bg-red-50 py-4 text-sm font-bold text-red-600 flex items-center justify-center gap-2 active:bg-red-100 transition-colors">
          <LogOut className="w-4 h-4" /> Logout
        </button>
      </div>
    </div>
  );
}
