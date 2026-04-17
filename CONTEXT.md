# XpressBank — Project Context for Claude

## Stack
- Next.js 16.2.3 (App Router, Turbopack)
- React 19, TypeScript, Tailwind CSS v4
- lucide-react v1.8, jsPDF, axios
- Windows, bash shell, bun package manager
- Deploy: Vercel, Root Directory = `trustcheck`, zero env vars needed

---

## Route Structure

```
app/
├── page.tsx                    # Landing page — PWA install button, fraud badge
├── layout.tsx                  # Root layout — manifest, theme-color, SW meta
├── globals.css                 # Tailwind v4, safe-area-bottom, scrollbar-hide
├── xpressbank/
│   ├── layout.tsx              # "use client" — registers SW, plain wrapper
│   ├── page.tsx                # redirect → /xpressbank/login
│   ├── login/page.tsx          # Green gradient login, saves to localStorage
│   ├── dashboard/page.tsx      # DUAL LAYOUT: mobile (sm:hidden) + desktop (hidden sm:flex)
│   ├── transactions/page.tsx   # Search + filter (all/sent/received/blocked)
│   ├── profile/page.tsx        # User info, security toggles, push notification enable
│   └── send-money/page.tsx     # redirect → /xpressbank/dashboard
└── api/
    ├── risk-score/route.ts     # POST — AI risk engine, returns {riskScore, level, reasons[], flagged}
    ├── check-recipient/route.ts # POST — legacy compat
    ├── check-account/route.ts  # GET+POST — {found, isScam, riskScore, complaints, recommendation}
    ├── check-link/route.ts     # GET+POST — OpenPhish + PhishTank parallel
    └── record-incoming/route.ts # POST — records incoming tx for refund scam detection
```

---

## Components

```
components/
├── Navbar.tsx                        # Global nav (NOT used in xpressbank)
├── WarningScreen.tsx                 # Full-screen red warning, 30s setInterval countdown
└── xpressbank/
    ├── SendMoneyModal.tsx            # Debounced live UPI check → /api/risk-score
    ├── TrustCheckWarning.tsx         # Red modal, CooldownTimer, checkbox, cancel/continue
    ├── CooldownTimer.tsx             # SVG circular countdown, red→orange at 10s
    ├── BalanceCard.tsx               # Reusable balance card
    └── RecentTransactions.tsx        # Transaction list with blocked badge
```

---

## Lib / Data

```
lib/
├── trustcheckAgent.ts   # In-memory risk engine — analyzeTransaction(), recordIncoming(), recordTransaction()
├── mockData.ts          # Loads scam-accounts.json — findAccountByUpiId(), getRiskScore()
├── openphish.ts         # Mock phishing URL list — checkOpenPhish(url)
└── phishtank.ts         # Mock phishing URL list — checkPhishTank(url)

data/
└── scam-accounts.json   # 34 scam accounts + 15 safe accounts
```

---

## Risk Engine (`lib/trustcheckAgent.ts`)

Returns `{ riskScore: 0-100, level: "low"|"medium"|"high", reasons: string[], flagged: boolean }`

| Signal | Points |
|---|---|
| UPI found in scam DB | +50 |
| complaints > 10 | +20 |
| Suspicious keyword in UPI (kyc, refund, verify, cbi, police, rbi...) | +10 |
| First-time recipient | +20 |
| Amount > 2× user average | +20 |
| Late night transaction (IST midnight–5AM) | +10 |
| Refund scam pattern (received money ≤30min ago, now sending to different UPI) | +40 |

In-memory `userProfiles` Map — resets on server restart.

---

## Dashboard Layout Pattern

`dashboard/page.tsx` has two completely separate layouts in one file:

- **Mobile** `<div className="sm:hidden">` — green header with balance hero card, 4-col quick actions, scrollable body, fixed bottom nav (5 tabs)
- **Desktop** `<div className="hidden sm:flex flex-1">` — top navbar only (no sidebar), full-width content: 3-col balance cards, 4-col quick actions, 2-col transaction table + right sidebar (spending donut, stats, UPI ID)

---

## PWA Setup

- `public/manifest.json` — theme: `#2D6A4F`, start_url: `/xpressbank/login`
- `public/sw.js` — handles `push`, `notificationclick`, `install`, `activate`
- SW registered in `xpressbank/layout.tsx`
- Landing page captures `beforeinstallprompt` (Android Chrome) — native install dialog
- iOS: shows bottom sheet with 3-step Share → Add to Home Screen instructions

---

## Credentials

```
Email:    test@gmail.com
Password: Password
```

## Test UPI IDs

| UPI ID | Result |
|---|---|
| `scammer@okhdfcbank` | 🔴 HIGH — scam DB |
| `kyc-update@sbi` | 🔴 HIGH — keyword + DB |
| `bank-upgrade@okhdfc` | 🔴 HIGH — 500 complaints |
| `rbi-notice@paytm` | 🔴 HIGH — 99/100 |
| `friend@okicici` | 🟢 LOW — safe |
| `any-new@upi` | 🟡 MEDIUM — first-time recipient |

---

## Known Issues / TODOs

1. **PWA icons missing** — `icon-192.png` and `icon-512.png` not in `/public`. Chrome won't show install prompt without them.
2. **`xpressbank-mobile/`** — leftover Expo scaffold in workspace root, file-locked, can't delete. Irrelevant.
3. **`components/Navbar.tsx`** — exists but unused (xpressbank has its own nav, bank-demo/checker deleted).
4. **`scripts/test-apis.js`** — Node script to test all APIs against localhost:3000.
