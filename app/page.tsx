import Link from "next/link";
import { Zap, Shield, CheckCircle, ArrowRight } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#F7F6F2] flex flex-col">
      {/* Nav */}
      <header className="bg-white border-b border-stone-100 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#2D6A4F] flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-slate-800">XpressBank</span>
        </div>
        <Link
          href="/xpressbank/login"
          className="rounded-xl bg-[#2D6A4F] hover:bg-[#245a42] transition-colors px-5 py-2 text-sm font-semibold text-white"
        >
          Login
        </Link>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-20 gap-12 text-center">
        <div className="flex flex-col items-center gap-6 max-w-2xl">
          <div className="w-16 h-16 rounded-2xl bg-[#2D6A4F] flex items-center justify-center shadow-lg">
            <Zap className="w-8 h-8 text-white" />
          </div>

          <div className="flex flex-col gap-3">
            <h1 className="text-4xl sm:text-5xl font-bold text-slate-800 leading-tight tracking-tight">
              Banking that keeps<br />
              <span className="text-[#2D6A4F]">your money safe</span>
            </h1>
            <p className="text-slate-500 text-lg max-w-lg mx-auto">
              XpressBank is a modern digital bank with built-in fraud detection — every transaction is verified before it goes through.
            </p>
          </div>

          {/* Fraud protection badge */}
          <div className="inline-flex items-center gap-2.5 rounded-2xl bg-white border border-emerald-100 shadow-sm px-5 py-3">
            <Shield className="w-5 h-5 text-[#2D6A4F]" />
            <div className="text-left">
              <p className="text-sm font-semibold text-slate-800">Fraud Protection Integrated</p>
              <p className="text-xs text-slate-400">Real-time UPI fraud detection on every payment</p>
            </div>
            <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium ml-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Active
            </span>
          </div>

          <Link
            href="/xpressbank/login"
            className="inline-flex items-center gap-2 rounded-xl bg-[#2D6A4F] hover:bg-[#245a42] transition-colors px-8 py-3.5 text-sm font-semibold text-white shadow-md"
          >
            Open Your Account <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Feature pills */}
        <div className="flex flex-wrap items-center justify-center gap-3 max-w-xl">
          {[
            "Real-time fraud detection",
            "Instant UPI transfers",
            "30-second fraud cooldown",
            "Zero-fee transactions",
            "KYC verified accounts",
          ].map((f) => (
            <span key={f} className="inline-flex items-center gap-1.5 rounded-full bg-white border border-stone-200 px-4 py-1.5 text-xs font-medium text-slate-600 shadow-sm">
              <CheckCircle className="w-3.5 h-3.5 text-[#2D6A4F]" /> {f}
            </span>
          ))}
        </div>
      </main>

      <footer className="border-t border-stone-100 px-6 py-5 text-center text-xs text-slate-400">
        © 2026 XpressBank · Secure Digital Banking
      </footer>
    </div>
  );
}
