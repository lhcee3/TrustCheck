"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, User, Phone, CreditCard, ShieldCheck, BadgeCheck, LogOut, Bell } from "lucide-react";

export default function ProfilePage() {
  const router = useRouter();
  const [userName, setUserName] = useState("Ramesh Sharma");
  const [mobile, setMobile] = useState("9876543210");
  const [upiId, setUpiId] = useState("ramesh@xpressbank");
  const [tcEnabled, setTcEnabled] = useState(true);
  const [alertsEnabled, setAlertsEnabled] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (localStorage.getItem("xb_loggedIn") !== "true") {
        router.replace("/xpressbank/login");
        return;
      }
      setUserName(localStorage.getItem("xb_userName") ?? "Ramesh Sharma");
      setMobile(localStorage.getItem("xb_userMobile") ?? "9876543210");
      setUpiId(localStorage.getItem("xb_upiId") ?? "ramesh@xpressbank");
    }
  }, [router]);

  function logout() {
    localStorage.clear();
    router.push("/xpressbank/login");
  }

  const initials = userName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
    return (
      <button
        onClick={onToggle}
        className={`w-11 h-6 rounded-full transition-colors relative ${on ? "bg-blue-600" : "bg-slate-200"}`}
      >
        <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${on ? "left-5.5 translate-x-0.5" : "left-0.5"}`} />
      </button>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-100 px-4 sm:px-8 py-4 flex items-center gap-3">
        <Link href="/xpressbank/dashboard" className="text-slate-400 hover:text-slate-600 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-base font-bold text-slate-800">Profile</h1>
      </div>

      <div className="max-w-lg mx-auto px-4 sm:px-8 py-6 flex flex-col gap-4">
        {/* Avatar */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white text-xl font-bold">
            {initials}
          </div>
          <div className="text-center">
            <p className="font-bold text-slate-800">{userName}</p>
            <p className="text-xs text-slate-400 font-mono mt-0.5">{upiId}</p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-1 text-xs font-medium">
            <BadgeCheck className="w-3.5 h-3.5" /> KYC Verified
          </span>
        </div>

        {/* User info */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col gap-3">
          <h2 className="text-sm font-bold text-slate-800">Personal Information</h2>
          {[
            { icon: <User className="w-4 h-4" />, label: "Full Name", value: userName },
            { icon: <Phone className="w-4 h-4" />, label: "Mobile", value: mobile },
            { icon: <ShieldCheck className="w-4 h-4" />, label: "UPI ID", value: upiId },
          ].map((row) => (
            <div key={row.label} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
              <div className="flex items-center gap-2 text-slate-500 text-xs">{row.icon} {row.label}</div>
              <span className="text-sm font-medium text-slate-700 font-mono">{row.value}</span>
            </div>
          ))}
        </div>

        {/* Linked accounts */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col gap-3">
          <h2 className="text-sm font-bold text-slate-800">Linked Accounts</h2>
          {[{ label: "Savings Account", num: "XXXX1234" }, { label: "Current Account", num: "XXXX5678" }].map((a) => (
            <div key={a.label} className="flex items-center justify-between rounded-xl bg-slate-50 border border-slate-100 px-4 py-3">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-slate-400" />
                <span className="text-sm font-medium text-slate-700">{a.label}</span>
              </div>
              <span className="text-xs text-slate-400 font-mono">{a.num}</span>
            </div>
          ))}
        </div>

        {/* Security settings */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col gap-4">
          <h2 className="text-sm font-bold text-slate-800">Security Settings</h2>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-500" />
              <span className="text-sm text-slate-700">Enable Fraud Protection</span>
            </div>
            <Toggle on={tcEnabled} onToggle={() => setTcEnabled((v) => !v)} />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-blue-500" />
              <span className="text-sm text-slate-700">Show real-time risk alerts</span>
            </div>
            <Toggle on={alertsEnabled} onToggle={() => setAlertsEnabled((v) => !v)} />
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={logout}
          className="w-full rounded-2xl border border-red-200 bg-red-50 hover:bg-red-100 transition-colors py-3 text-sm font-semibold text-red-600 flex items-center justify-center gap-2"
        >
          <LogOut className="w-4 h-4" /> Logout
        </button>
      </div>
    </div>
  );
}
