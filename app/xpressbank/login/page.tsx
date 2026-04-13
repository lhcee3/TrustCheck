"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Zap, Shield, Loader2 } from "lucide-react";

export default function XpressBankLogin() {
  const router = useRouter();
  const [customerId, setCustomerId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem("xb_loggedIn") === "true") {
      router.replace("/xpressbank/dashboard");
    }
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, [router]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    if (customerId === "test@gmail.com" && password === "Password") {
      localStorage.setItem("xb_loggedIn", "true");
      localStorage.setItem("xb_userName", "Ramesh Sharma");
      localStorage.setItem("xb_userMobile", "9876543210");
      localStorage.setItem("xb_balance", "425000");
      localStorage.setItem("xb_upiId", "ramesh@xpressbank");
      // Request notification permission after login
      if ("Notification" in window && Notification.permission === "default") {
        await Notification.requestPermission();
      }
      router.push("/xpressbank/dashboard");
    } else {
      setError("Invalid credentials");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#2D6A4F] flex flex-col">
      {/* Top branding area */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pt-16 pb-8 gap-4">
        <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center">
          <Zap className="w-8 h-8 text-white" />
        </div>
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white">XpressBank</h1>
          <p className="text-emerald-200 text-sm mt-1">Secure · Fast · Protected</p>
        </div>
      </div>

      {/* Login card — slides up from bottom */}
      <div className="bg-[#F7F6F2] rounded-t-3xl px-6 pt-8 pb-10 flex flex-col gap-5 shadow-2xl">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Welcome back</h2>
          <p className="text-slate-500 text-sm mt-0.5">Sign in to your account</p>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Email / Customer ID</label>
            <input
              type="text"
              placeholder="test@gmail.com"
              value={customerId}
              onChange={(e) => { setCustomerId(e.target.value); setError(""); }}
              required
              className="rounded-2xl border border-stone-200 bg-white px-4 py-3.5 text-base text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#2D6A4F] transition-colors"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(""); }}
              required
              className="rounded-2xl border border-stone-200 bg-white px-4 py-3.5 text-base text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#2D6A4F] transition-colors"
            />
          </div>
          {error && <p className="text-sm text-red-500 text-center">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="rounded-2xl bg-[#2D6A4F] hover:bg-[#245a42] disabled:opacity-60 transition-colors py-4 text-base font-bold text-white flex items-center justify-center gap-2 mt-2"
          >
            {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Signing in...</> : "Login"}
          </button>
        </form>

        <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400">
          <Shield className="w-3.5 h-3.5 text-[#2D6A4F]" />
          AI-powered fraud protection on every transaction
        </div>

        <p className="text-center text-xs text-slate-400">
          Demo: test@gmail.com / Password
        </p>
      </div>
    </div>
  );
}
