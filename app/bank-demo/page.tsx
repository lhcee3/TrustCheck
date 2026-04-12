"use client";

import { useState } from "react";
import { ShieldAlert, Send, X, CheckCircle, ShieldCheck, Loader2 } from "lucide-react";
import WarningScreen from "@/components/WarningScreen";

type Screen = "login" | "dashboard" | "send";

export default function BankDemoPage() {
  const [screen, setScreen] = useState<Screen>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [upiId, setUpiId] = useState("");
  const [amount, setAmount] = useState("");
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Warning + success state
  const [showWarning, setShowWarning] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [warnRiskScore, setWarnRiskScore] = useState(0);
  const [warnReason, setWarnReason] = useState("");

  function resetForm() {
    setUpiId("");
    setAmount("");
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (email === "test@gmail.com" && password === "Password") {
      setScreen("dashboard");
    } else {
      alert("Invalid credentials. Use test@gmail.com / Password");
    }
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    try {
      const res = await fetch("/api/check-recipient", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ upiId, amount: Number(amount) }),
      });
      const data = await res.json();

      if (data.flagged) {
        setWarnRiskScore(data.riskScore);
        setWarnReason(data.reason);
        setShowWarning(true);
      } else {
        setUpiId("");
        setAmount("");
        setScreen("dashboard");
        showToast("Transaction sent (demo mode)");
      }
    } catch {
      showToast("Something went wrong. Please try again.");
    } finally {
      setSending(false);
    }
  }

  if (showWarning) {
    return (
      <WarningScreen
        riskScore={warnRiskScore}
        reason={warnReason}
        onCancel={() => {
          setShowWarning(false);
          setShowSuccess(true);
          resetForm();
        }}
        onContinue={() => {
          setShowWarning(false);
          resetForm();
          setScreen("dashboard");
          showToast("Transaction sent (demo mode)");
        }}
      />
    );
  }

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center px-6">
        <div className="w-full max-w-sm flex flex-col items-center gap-6 text-center">
          <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <ShieldCheck className="w-10 h-10 text-emerald-400" />
          </div>
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-bold text-emerald-400">Fraud Prevented!</h1>
            <p className="text-gray-400 text-sm">
              Your money is safe. The transaction was blocked by TrustCheck.
            </p>
          </div>
          <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/20 px-6 py-4 w-full">
            <p className="text-emerald-300 text-sm">
              TrustCheck detected a high-risk recipient and protected your account.
            </p>
          </div>
          <button
            onClick={() => {
              setShowSuccess(false);
              setScreen("dashboard");
            }}
            className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 transition-colors py-3 text-sm font-medium"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (screen === "login") {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center px-6">
        <div className="w-full max-w-sm flex flex-col gap-6">
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center">
              <ShieldAlert className="w-6 h-6 text-indigo-400" />
            </div>
            <h1 className="text-2xl font-bold">XYZ Bank</h1>
            <p className="text-gray-400 text-sm">Sign in to your account</p>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="rounded-xl bg-gray-900 border border-gray-700 px-4 py-3 text-sm placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="rounded-xl bg-gray-900 border border-gray-700 px-4 py-3 text-sm placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
            <button
              type="submit"
              className="rounded-xl bg-indigo-600 hover:bg-indigo-500 transition-colors py-3 text-sm font-medium"
            >
              Sign In
            </button>
          </form>

          <p className="text-center text-xs text-gray-600">
            Use test@gmail.com / Password
          </p>
        </div>
      </div>
    );
  }

  if (screen === "send") {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center px-6">
        <div className="w-full max-w-sm flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Send Money</h2>
            <button
              onClick={() => setScreen("dashboard")}
              className="text-gray-500 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSend} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-gray-400">UPI ID</label>
              <input
                type="text"
                placeholder="e.g. friend@okicici"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                required
                className="rounded-xl bg-gray-900 border border-gray-700 px-4 py-3 text-sm placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-gray-400">Amount (₹)</label>
              <input
                type="number"
                placeholder="e.g. 500"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                min={1}
                className="rounded-xl bg-gray-900 border border-gray-700 px-4 py-3 text-sm placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={sending}
              className="mt-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 transition-colors py-3 text-sm font-medium flex items-center justify-center gap-2"
            >
              {sending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Checking...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Dashboard
  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* Success toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-emerald-600 text-white text-sm px-5 py-3 rounded-2xl shadow-lg z-50">
          <CheckCircle className="w-4 h-4" />
          {toast}
        </div>
      )}

      <header className="border-b border-gray-800 px-6 py-4 flex items-center">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-indigo-400" />
          <span className="font-semibold text-indigo-400">XYZ Bank</span>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm flex flex-col gap-6">
          <div className="rounded-2xl bg-indigo-600 p-6 flex flex-col gap-1">
            <p className="text-indigo-200 text-sm">Available Balance</p>
            <p className="text-4xl font-bold">₹50,000</p>
            <p className="text-indigo-300 text-xs mt-1">XYZ Bank Savings Account</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setScreen("send")}
              className="flex flex-col items-center gap-2 rounded-2xl bg-gray-900 border border-gray-800 hover:border-emerald-500/50 transition-colors p-5"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <Send className="w-5 h-5 text-emerald-400" />
              </div>
              <span className="text-sm font-medium">Send Money</span>
            </button>

            <div className="flex flex-col items-center gap-2 rounded-2xl bg-gray-900 border border-gray-800 p-5 opacity-40 cursor-not-allowed">
              <div className="w-10 h-10 rounded-xl bg-gray-700 flex items-center justify-center">
                <ShieldAlert className="w-5 h-5 text-gray-400" />
              </div>
              <span className="text-sm font-medium">History</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
