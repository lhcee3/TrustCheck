"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Zap, Shield, CheckCircle, ArrowRight, Download, Bell } from "lucide-react";

export default function LandingPage() {
  const [installPrompt, setInstallPrompt] = useState<Event | null>(null);
  const [installed, setInstalled] = useState(false);
  const [notifStatus, setNotifStatus] = useState<NotificationPermission | "unsupported">("default");
  const [showInstallGuide, setShowInstallGuide] = useState(false);

  useEffect(() => {
    // Capture the install prompt
    const handler = (e: Event) => { e.preventDefault(); setInstallPrompt(e); };
    window.addEventListener("beforeinstallprompt", handler);

    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) setInstalled(true);

    // Check notification permission
    if (!("Notification" in window)) {
      setNotifStatus("unsupported");
    } else {
      setNotifStatus(Notification.permission);
    }

    // Register service worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  async function handleInstall() {
    if (!installPrompt) return;
    // @ts-expect-error prompt() is non-standard
    await installPrompt.prompt();
    // @ts-expect-error
    const { outcome } = await installPrompt.userChoice;
    if (outcome === "accepted") setInstalled(true);
    setInstallPrompt(null);
  }

  async function requestNotifications() {
    if (!("Notification" in window)) return;
    const perm = await Notification.requestPermission();
    setNotifStatus(perm);
    if (perm === "granted" && "serviceWorker" in navigator) {
      const reg = await navigator.serviceWorker.ready.catch(() => null);
      if (reg) {
        reg.showNotification("✅ XpressBank Alerts Enabled", {
          body: "You'll be notified instantly if a fraud attempt is detected.",
          icon: "/icon-192.png",
          tag: "welcome",
        });
      }
    }
  }

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
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-16 gap-10 text-center">
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
              XpressBank is a modern digital bank with built-in AI fraud detection — every transaction is verified before it goes through.
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

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <Link
              href="/xpressbank/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#2D6A4F] hover:bg-[#245a42] transition-colors px-8 py-3.5 text-sm font-semibold text-white shadow-md"
            >
              Open Your Account <ArrowRight className="w-4 h-4" />
            </Link>

            {/* Install PWA button — always visible, smart behaviour */}
            {!installed ? (
              <button
                onClick={installPrompt ? handleInstall : () => setShowInstallGuide((v) => !v)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-white border border-stone-200 hover:border-[#2D6A4F] hover:bg-emerald-50 transition-colors px-6 py-3.5 text-sm font-semibold text-slate-700 shadow-sm"
              >
                <Download className="w-4 h-4 text-[#2D6A4F]" />
                Download App
              </button>
            ) : (
              <span className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-5 py-3 text-sm font-medium text-emerald-700">
                <CheckCircle className="w-4 h-4" /> App Installed
              </span>
            )}
          </div>

          {/* Install guide (shown when no native prompt — iOS / Firefox) */}
          {showInstallGuide && !installed && (
            <div className="bg-white border border-stone-200 rounded-2xl px-5 py-4 max-w-sm text-left shadow-sm w-full">
              <p className="text-sm font-bold text-slate-800 mb-2">📱 How to install XpressBank</p>
              <div className="flex flex-col gap-1.5 text-xs text-slate-500">
                <p><span className="font-semibold text-slate-700">iPhone / Safari:</span> Tap the Share icon → "Add to Home Screen"</p>
                <p><span className="font-semibold text-slate-700">Android / Chrome:</span> Tap the 3-dot menu → "Add to Home Screen" or "Install App"</p>
                <p><span className="font-semibold text-slate-700">Desktop Chrome:</span> Click the install icon in the address bar</p>
              </div>
            </div>
          )}

          {/* Notification permission button */}
          {notifStatus === "default" && (
            <button
              onClick={requestNotifications}
              className="inline-flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200 hover:bg-amber-100 transition-colors px-5 py-2.5 text-sm font-medium text-amber-700"
            >
              <Bell className="w-4 h-4" />
              Enable Fraud Alerts — get notified instantly on your phone
            </button>
          )}
          {notifStatus === "granted" && (
            <span className="inline-flex items-center gap-2 text-xs text-emerald-600">
              <CheckCircle className="w-3.5 h-3.5" /> Fraud alerts enabled — you'll be notified even when the app is closed
            </span>
          )}
          {notifStatus === "denied" && (
            <span className="text-xs text-slate-400">
              Notifications blocked — enable them in browser settings to receive fraud alerts
            </span>
          )}
        </div>

        {/* Feature pills */}
        <div className="flex flex-wrap items-center justify-center gap-3 max-w-xl">
          {[
            "AI-powered fraud detection",
            "Instant UPI transfers",
            "30-second fraud cooldown",
            "Push notifications on fraud",
            "KYC verified accounts",
            "Works offline (PWA)",
          ].map((f) => (
            <span key={f} className="inline-flex items-center gap-1.5 rounded-full bg-white border border-stone-200 px-4 py-1.5 text-xs font-medium text-slate-600 shadow-sm">
              <CheckCircle className="w-3.5 h-3.5 text-[#2D6A4F]" /> {f}
            </span>
          ))}
        </div>

        {/* Mobile install instructions (shown when no install prompt but on mobile) */}
        <div className="sm:hidden bg-white border border-stone-200 rounded-2xl px-5 py-4 max-w-sm text-left shadow-sm">
          <p className="text-xs font-semibold text-slate-700 mb-2">📱 Install on iPhone / Android</p>
          <p className="text-xs text-slate-500 leading-relaxed">
            <span className="font-medium">iOS:</span> Tap the Share button → "Add to Home Screen"<br />
            <span className="font-medium">Android:</span> Tap the menu → "Add to Home Screen" or "Install App"
          </p>
        </div>
      </main>

      <footer className="border-t border-stone-100 px-6 py-5 text-center text-xs text-slate-400">
        © 2026 XpressBank · Secure Digital Banking
      </footer>
    </div>
  );
}
