"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Zap, Shield, CheckCircle, ArrowRight, Smartphone, Bell, Share, Activity } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

type Platform = "android" | "ios" | "desktop" | "unknown";

function detectPlatform(): Platform {
  const ua = navigator.userAgent;
  if (/android/i.test(ua)) return "android";
  if (/iphone|ipad|ipod/i.test(ua)) return "ios";
  if (window.matchMedia("(pointer: coarse)").matches) return "android"; // generic mobile
  return "desktop";
}

export default function LandingPage() {
  const [installPrompt, setInstallPrompt] = useState<Event | null>(null);
  const [installed, setInstalled] = useState(false);
  const [platform, setPlatform] = useState<Platform>("unknown");
  const [showIOSSheet, setShowIOSSheet] = useState(false);
  const [notifGranted, setNotifGranted] = useState(false);

  useEffect(() => {
    setPlatform(detectPlatform());

    if (window.matchMedia("(display-mode: standalone)").matches) {
      setInstalled(true);
    }

    if ("Notification" in window && Notification.permission === "granted") {
      setNotifGranted(true);
    }

    // Android Chrome / desktop Chrome — capture native install prompt
    const handler = (e: Event) => { e.preventDefault(); setInstallPrompt(e); };
    window.addEventListener("beforeinstallprompt", handler);

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  async function handleInstallClick() {
    if (installPrompt) {
      // Android Chrome / desktop — native prompt
      // @ts-expect-error non-standard
      await installPrompt.prompt();
      // @ts-expect-error
      const { outcome } = await installPrompt.userChoice;
      if (outcome === "accepted") setInstalled(true);
      setInstallPrompt(null);
    } else if (platform === "ios") {
      // iOS — show bottom sheet with Share instructions
      setShowIOSSheet(true);
    } else {
      // Fallback — open app directly
      window.location.href = "/xpressbank/login";
    }
  }

  async function requestNotifications() {
    if (!("Notification" in window)) return;
    const perm = await Notification.requestPermission();
    if (perm === "granted") {
      setNotifGranted(true);
      const reg = await navigator.serviceWorker?.ready.catch(() => null);
      reg?.showNotification("✅ XpressBank Alerts Enabled", {
        body: "You'll be notified instantly if a fraud attempt is detected.",
        icon: "/icon-192.png",
      });
    }
  }

  const installLabel = installed ? "App Installed ✓" :
    platform === "ios" ? "Add to Home Screen" :
    installPrompt ? "Install App" :
    "Open App";

  return (
    <div className="min-h-screen bg-[#F7F6F2] flex flex-col">
      {/* iOS install bottom sheet */}
      {showIOSSheet && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end" onClick={() => setShowIOSSheet(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative bg-white rounded-t-3xl px-6 pt-5 pb-10 flex flex-col gap-4" onClick={(e) => e.stopPropagation()}>
            <div className="w-10 h-1 rounded-full bg-stone-200 mx-auto mb-1" />
            <h3 className="text-base font-bold text-slate-800 text-center">Add XpressBank to Home Screen</h3>
            <div className="flex flex-col gap-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#2D6A4F]/10 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-sm font-bold text-[#2D6A4F]">1</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">Tap the Share button</p>
                  <p className="text-xs text-slate-500 mt-0.5">The <Share className="w-3.5 h-3.5 inline" /> icon at the bottom of Safari</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#2D6A4F]/10 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-sm font-bold text-[#2D6A4F]">2</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">Tap "Add to Home Screen"</p>
                  <p className="text-xs text-slate-500 mt-0.5">Scroll down in the share sheet to find it</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#2D6A4F]/10 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-sm font-bold text-[#2D6A4F]">3</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">Tap "Add"</p>
                  <p className="text-xs text-slate-500 mt-0.5">XpressBank appears on your home screen like a native app</p>
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowIOSSheet(false)}
              className="mt-2 rounded-2xl bg-[#2D6A4F] py-3.5 text-sm font-bold text-white"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* Nav */}
      <header className="bg-white border-b border-stone-100 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#2D6A4F] flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-slate-800">XpressBank</span>
        </div>
        <Link href="/xpressbank/login"
          className="rounded-xl bg-[#2D6A4F] hover:bg-[#245a42] transition-colors px-5 py-2 text-sm font-semibold text-white"
        >
          Login
        </Link>
      </header>

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
            <Link href="/xpressbank/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#2D6A4F] hover:bg-[#245a42] transition-colors px-8 py-3.5 text-sm font-semibold text-white shadow-md"
            >
              Open Your Account <ArrowRight className="w-4 h-4" />
            </Link>

            {!installed ? (
              <button
                onClick={handleInstallClick}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-white border-2 border-[#2D6A4F] hover:bg-emerald-50 transition-colors px-6 py-3.5 text-sm font-semibold text-[#2D6A4F] shadow-sm"
              >
                <Smartphone className="w-4 h-4" />
                {installLabel}
              </button>
            ) : (
              <span className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-5 py-3 text-sm font-medium text-emerald-700">
                <CheckCircle className="w-4 h-4" /> App Installed
              </span>
            )}
          </div>

          {/* Notification button */}
          {!notifGranted && (
            <button onClick={requestNotifications}
              className="inline-flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200 hover:bg-amber-100 transition-colors px-5 py-2.5 text-sm font-medium text-amber-700"
            >
              <Bell className="w-4 h-4" />
              Enable fraud alerts on this device
            </button>
          )}
          {notifGranted && (
            <span className="inline-flex items-center gap-2 text-xs text-emerald-600">
              <CheckCircle className="w-3.5 h-3.5" /> Fraud alerts enabled
            </span>
          )}
        </div>

        {/* Feature pills */}
        <div className="flex flex-wrap items-center justify-center gap-3 max-w-xl">
          {["AI fraud detection", "Instant UPI transfers", "30s fraud cooldown", "Push notifications", "No app store needed", "Works offline"].map((f) => (
            <span key={f} className="inline-flex items-center gap-1.5 rounded-full bg-white border border-stone-200 px-4 py-1.5 text-xs font-medium text-slate-600 shadow-sm">
              <CheckCircle className="w-3.5 h-3.5 text-[#2D6A4F]" /> {f}
            </span>
          ))}
        </div>

        {/* Live monitor QR */}
        <div className="flex flex-col items-center gap-4 bg-white border border-stone-200 rounded-3xl px-8 py-6 shadow-sm max-w-sm w-full">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
            <Activity className="w-4 h-4 text-[#2D6A4F]" /> Live Fraud Monitor
          </div>
          <div className="bg-[#F7F6F2] p-3 rounded-2xl">
            <QRCodeSVG value={`${typeof window !== "undefined" ? window.location.origin : ""}/monitor`} size={120} fgColor="#2D6A4F" />
          </div>
          <div className="text-center">
            <p className="text-xs font-medium text-slate-700">Scan with your phone</p>
            <p className="text-xs text-slate-400 mt-0.5">See live fraud alerts as they happen</p>
          </div>
          <Link href="/monitor" className="text-xs text-[#2D6A4F] font-medium hover:underline flex items-center gap-1">
            Open Monitor <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </main>

      <footer className="border-t border-stone-100 px-6 py-5 text-center text-xs text-slate-400">
        © 2026 XpressBank · Secure Digital Banking
      </footer>
    </div>
  );
}
