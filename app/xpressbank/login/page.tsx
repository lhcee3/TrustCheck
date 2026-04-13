"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Zap, ShieldCheck, Loader2 } from "lucide-react";

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
      router.push("/xpressbank/dashboard");
    } else {
      setError("Invalid credentials. Use test@gmail.com / Password");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-[#2D6A4F] to-[#1a4a35] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl shadow-xl p-8 flex flex-col gap-6">
          {/* Logo */}
          <div className="flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-[#2D6A4F] flex items-center justify-center">
              <Zap className="w-7 h-7 text-white" />
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-bold text-slate-800">XpressBank</h1>
              <p className="text-slate-400 text-xs mt-0.5">Welcome back! Please sign in.</p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-slate-500">Customer ID / Email</label>
              <input
                type="text"
                placeholder="test@gmail.com"
                value={customerId}
                onChange={(e) => { setCustomerId(e.target.value); setError(""); }}
                required
                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-slate-500">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(""); }}
                required
                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            {error && <p className="text-xs text-red-500 text-center">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-[#2D6A4F] hover:bg-[#245a42] disabled:opacity-60 transition-colors py-3 text-sm font-semibold text-white flex items-center justify-center gap-2"
            >
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in...</> : "Login to XpressBank"}
            </button>
          </form>

          <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
            Secure banking with real-time fraud protection
          </div>
        </div>

        <p className="text-center text-blue-200 text-xs mt-4">
          Use test@gmail.com / Password
        </p>
      </div>
    </div>
  );
}
