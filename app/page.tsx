import Link from "next/link";
import { Building2, ScanSearch } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-950 text-white">
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-20 gap-16">
        {/* Hero */}
        <section className="text-center max-w-3xl flex flex-col items-center gap-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-indigo-500/10 border border-indigo-500/30 px-4 py-1.5 text-sm text-indigo-300">
            Real-Time Fraud Prevention
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight tracking-tight">
            TrustCheck —{" "}
            <span className="text-indigo-400">Real-Time Fraud Prevention</span>{" "}
            for Indian Banking
          </h1>

          <p className="text-gray-400 text-lg sm:text-xl max-w-xl">
            Protect your customers before money moves. Instant UPI ID and link
            risk scoring powered by live threat intelligence.
          </p>

          {/* Stat */}
          <div className="rounded-2xl bg-red-500/10 border border-red-500/20 px-8 py-6">
            <p className="text-3xl sm:text-4xl font-bold text-red-400">₹1,500+ Crores</p>
            <p className="text-gray-400 mt-1 text-sm sm:text-base">
              lost annually to UPI fraud in India
            </p>
          </div>
        </section>

        {/* Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-2xl">
          <div className="flex flex-col gap-4 rounded-2xl bg-gray-900 border border-gray-800 p-8 hover:border-indigo-500/50 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">XYZ Bank Demo</h2>
              <p className="text-gray-400 text-sm mt-1">
                See TrustCheck integrated into a live banking payment flow.
              </p>
            </div>
            <Link
              href="/bank-demo"
              className="mt-auto inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 transition-colors px-5 py-2.5 text-sm font-medium"
            >
              <Building2 className="w-4 h-4" />
              Open Bank Demo
            </Link>
          </div>

          <div className="flex flex-col gap-4 rounded-2xl bg-gray-900 border border-gray-800 p-8 hover:border-emerald-500/50 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
              <ScanSearch className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Checker Tool</h2>
              <p className="text-gray-400 text-sm mt-1">
                Manually check any UPI ID or link for fraud risk in real time.
              </p>
            </div>
            <Link
              href="/checker"
              className="mt-auto inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 transition-colors px-5 py-2.5 text-sm font-medium"
            >
              <ScanSearch className="w-4 h-4" />
              Open Checker
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 px-6 py-6 flex items-center justify-center gap-2 text-sm text-gray-500">
        Built by <span className="text-gray-300 font-medium">Team Tiger Claw</span>
      </footer>
    </div>
  );
}
