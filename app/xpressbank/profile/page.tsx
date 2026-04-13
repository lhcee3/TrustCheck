"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, User, Phone, Shield, BadgeCheck, LogOut, Bell, Copy, CheckCircle, CreditCard } from "lucide-react";

function Toggle({ on, onToggle, color = "bg-[#2D6A4F]" }: { on: boolean; onToggle: () => void; color?: string }) {
  return (
    <button onClick={onToggle}
      className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ${on ? color : "bg-slate-200"}`}
    >
      <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all duration-200 ${on ? "left-6" : "left-0.5"}`} />
    </button>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const [userName, setUserName] = useState("Ramesh Sharma");
  const [mobile, setMobile] = useState("9876543210");
  const [upiId, setUpiId] = useState("ramesh@xpressbank");
  const [fraudEnabled, setFraudEnabled] = useState(true);
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [notifStatus, setNotifStatus] = useState<string>("default");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (localStorage.getItem("xb_loggedIn") !== "true") { router.replace("/xpressbank/login"); return; }
      setUserName(localStorage.getItem("xb_userName") ?? "Ramesh Sharma");
      setMobile(localStorage.getItem("xb_userMobile") ?? "9876543210");
      setUpiId(localStorage.getItem("xb_upiId") ?? "ramesh@xpressbank");
      if ("Notification" in window) setNotifStatus(Notification.permission);
    }
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

  function copyUpi() { navigator.clipboard.writeText(upiId); setCopied(true); setTimeout(() => setCopied(false), 1500); }
  function logout() { localStorage.clear(); router.push("/xpressbank/login"); }

  const initials = userName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-[#F7F6F2] flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-stone-100 px-4 pt-12 pb-4 flex items-center gap-3">
        <Link href="/xpressbank/dashboard" className="w-9 h-9 rounded-xl bg-stone-100 flex items-center justify-center text-slate-600">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <h1 className="text-base font-bold text-slate-800">Profile</h1>
      </div>

      <div className="flex-1 px-4 py-5 pb-10 flex flex-col gap-4">
        {/* Avatar card */}
        <div className="bg-[#2D6A4F] rounded-2xl p-6 flex flex-col items-center gap-3 text-center">
          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-white text-2xl font-bold">
            {initials}
          </div>
          <div>
            <p className="font-bold text-white text-lg">{userName}</p>
            <div className="flex items-center justify-center gap-2 mt-1">
              <p className="text-emerald-200 text-xs font-mono">{upiId}</p>
              <button onClick={copyUpi} className="text-emerald-200 hover:text-white transition-colors">
                {copied ? <CheckCircle className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 text-white px-3 py-1 text-xs font-medium">
            <BadgeCheck className="w-3.5 h-3.5" /> KYC Verified
          </span>
        </div>

        {/* Personal info */}
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-stone-50">
            <h2 className="text-sm font-bold text-slate-800">Personal Information</h2>
          </div>
          {[
            { icon: <User className="w-4 h-4 text-slate-400" />, label: "Full Name", value: userName },
            { icon: <Phone className="w-4 h-4 text-slate-400" />, label: "Mobile", value: mobile },
            { icon: <Shield className="w-4 h-4 text-slate-400" />, label: "UPI ID", value: upiId, mono: true },
          ].map((row) => (
            <div key={row.label} className="flex items-center justify-between px-4 py-3.5 border-b border-stone-50 last:border-0">
              <div className="flex items-center gap-2.5 text-slate-500 text-sm">{row.icon} {row.label}</div>
              <span className={`text-sm font-medium text-slate-700 ${row.mono ? "font-mono text-xs" : ""}`}>{row.value}</span>
            </div>
          ))}
        </div>

        {/* Linked accounts */}
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-stone-50">
            <h2 className="text-sm font-bold text-slate-800">Linked Accounts</h2>
          </div>
          {[{ label: "Savings Account", num: "XXXX1234" }, { label: "Current Account", num: "XXXX5678" }].map((a) => (
            <div key={a.label} className="flex items-center justify-between px-4 py-3.5 border-b border-stone-50 last:border-0">
              <div className="flex items-center gap-2.5">
                <CreditCard className="w-4 h-4 text-slate-400" />
                <span className="text-sm font-medium text-slate-700">{a.label}</span>
              </div>
              <span className="text-xs text-slate-400 font-mono">{a.num}</span>
            </div>
          ))}
        </div>

        {/* Security settings */}
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-stone-50">
            <h2 className="text-sm font-bold text-slate-800">Security & Alerts</h2>
          </div>
          <div className="flex items-center justify-between px-4 py-4 border-b border-stone-50">
            <div className="flex items-center gap-2.5">
              <Shield className="w-4 h-4 text-[#2D6A4F]" />
              <div>
                <p className="text-sm font-medium text-slate-700">Fraud Protection</p>
                <p className="text-xs text-slate-400">AI checks every transaction</p>
              </div>
            </div>
            <Toggle on={fraudEnabled} onToggle={() => setFraudEnabled((v) => !v)} />
          </div>
          <div className="flex items-center justify-between px-4 py-4 border-b border-stone-50">
            <div className="flex items-center gap-2.5">
              <Bell className="w-4 h-4 text-[#2D6A4F]" />
              <div>
                <p className="text-sm font-medium text-slate-700">Risk Alerts</p>
                <p className="text-xs text-slate-400">In-app fraud warnings</p>
              </div>
            </div>
            <Toggle on={alertsEnabled} onToggle={() => setAlertsEnabled((v) => !v)} />
          </div>
          {/* Push notification row */}
          <div className="flex items-center justify-between px-4 py-4">
            <div className="flex items-center gap-2.5">
              <Bell className="w-4 h-4 text-amber-500" />
              <div>
                <p className="text-sm font-medium text-slate-700">Push Notifications</p>
                <p className="text-xs text-slate-400">
                  {notifStatus === "granted" ? "✅ Enabled — alerts even when app is closed" :
                   notifStatus === "denied" ? "❌ Blocked in browser settings" :
                   "Get notified on fraud attempts"}
                </p>
              </div>
            </div>
            {notifStatus !== "granted" && notifStatus !== "denied" && (
              <button onClick={requestNotifications}
                className="rounded-xl bg-amber-50 border border-amber-200 text-amber-700 px-3 py-1.5 text-xs font-semibold"
              >
                Enable
              </button>
            )}
            {notifStatus === "granted" && <span className="text-xs text-emerald-600 font-medium">Active</span>}
          </div>
        </div>

        {/* Logout */}
        <button onClick={logout}
          className="w-full rounded-2xl border border-red-200 bg-red-50 py-4 text-sm font-bold text-red-600 flex items-center justify-center gap-2 active:bg-red-100 transition-colors"
        >
          <LogOut className="w-4 h-4" /> Logout
        </button>
      </div>
    </div>
  );
}
