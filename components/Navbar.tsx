"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldAlert, Menu, X } from "lucide-react";
import { useState } from "react";

const links = [
  { href: "/", label: "Home" },
  { href: "/bank-demo", label: "Bank Demo" },
  { href: "/checker", label: "Checker Tool" },
  { href: "/case-study", label: "Case Study" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <nav className="border-b border-gray-800 bg-gray-950 px-6 py-4 flex items-center justify-between relative z-50">
      {/* Brand */}
      <Link href="/" className="flex items-center gap-2 text-indigo-400 font-semibold">
        <ShieldAlert className="w-5 h-5" />
        TrustCheck
      </Link>

      {/* Desktop links */}
      <div className="hidden sm:flex items-center gap-1">
        {links.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={`px-4 py-2 rounded-lg text-sm transition-colors ${
              pathname === href
                ? "bg-indigo-600 text-white"
                : "text-gray-400 hover:text-white hover:bg-gray-800"
            }`}
          >
            {label}
          </Link>
        ))}
      </div>

      {/* Mobile hamburger */}
      <button
        className="sm:hidden text-gray-400 hover:text-white transition-colors"
        onClick={() => setOpen((o) => !o)}
        aria-label="Toggle menu"
      >
        {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile menu */}
      {open && (
        <div className="absolute top-full left-0 right-0 bg-gray-950 border-b border-gray-800 flex flex-col p-4 gap-1 sm:hidden">
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={`px-4 py-2.5 rounded-lg text-sm transition-colors ${
                pathname === href
                  ? "bg-indigo-600 text-white"
                  : "text-gray-400 hover:text-white hover:bg-gray-800"
              }`}
            >
              {label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
