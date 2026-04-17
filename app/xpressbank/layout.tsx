"use client";

import { useEffect } from "react";

export default function XpressBankLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  return <div className="min-h-screen bg-[#F7F6F2]">{children}</div>;
}
