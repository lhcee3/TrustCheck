# XpressBank — AI-Powered Fraud Prevention Demo

A full-stack banking demo built with Next.js, showcasing real-time UPI fraud detection powered by a rule-based AI agent (TrustCheck).

Built by **Team Tiger Claw**.

---

## Live Demo

Deploy to Vercel — no environment variables required. Zero config.

---

## Features

- Full banking UI (login, dashboard, transactions, profile)
- AI risk engine scoring 0–100 across 6 behavioral signals
- Real-time UPI ID verification while typing (debounced)
- 30-second cooldown warning screen on high-risk transactions
- PWA — installable on iPhone and Android
- Push notifications on fraud detection (works when app is closed)
- Spending insights donut chart
- Mobile-first, responsive design

## Fraud Detection Signals

The risk engine (`lib/trustcheckAgent.ts`) scores each transaction:

| Signal | Score |
|---|---|
| Recipient in scam database | +50 |
| 10+ complaints on record | +20 |
| Suspicious keyword in UPI ID (kyc, refund, verify...) | +10 |
| First-time recipient | +20 |
| Amount > 2x user average | +20 |
| Late night transaction (12AM–5AM) | +10 |
| Refund scam pattern (received money, now sending to different UPI within 30min) | +40 |

Score ≥ 70 → HIGH risk → warning screen + push notification

## Routes

| Route | Description |
|---|---|
| `/` | Landing page with PWA install button |
| `/xpressbank/login` | Login screen |
| `/xpressbank/dashboard` | Main banking dashboard |
| `/xpressbank/transactions` | Transaction history with search/filter |
| `/xpressbank/profile` | Profile, security settings, notification toggle |

## API Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/api/risk-score` | POST | AI risk scoring engine |
| `/api/check-recipient` | POST | Legacy UPI check (backward compat) |
| `/api/check-account` | GET/POST | Account risk lookup |
| `/api/check-link` | GET/POST | URL phishing check |
| `/api/record-incoming` | POST | Record incoming transaction (for refund scam detection) |

## Demo Credentials

```
Email:    test@gmail.com
Password: Password
```

## Test UPI IDs

| UPI ID | Expected |
|---|---|
| `scammer@okhdfcbank` | 🔴 HIGH — blocked |
| `kyc-update@sbi` | 🔴 HIGH — keyword + DB match |
| `bank-upgrade@okhdfc` | 🔴 HIGH — 500 complaints |
| `friend@okicici` | 🟢 LOW — safe |
| `any-new@upi` | 🟡 MEDIUM — first-time recipient |

## Vercel Deployment

1. Push to GitHub
2. Import repo in [vercel.com/new](https://vercel.com/new)
3. Set **Root Directory** to `trustcheck`
4. Deploy — no environment variables needed

```
Root Directory: trustcheck
Framework:      Next.js (auto-detected)
Build Command:  next build (default)
```

## PWA Install

- **Android Chrome:** tap the 3-dot menu → "Add to Home Screen"
- **iPhone Safari:** tap Share → "Add to Home Screen"
- **Desktop Chrome:** click the install icon in the address bar

Once installed, push notifications work even when the app is closed.

## Tech Stack

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS v4
- lucide-react
- jsPDF
- PWA (custom service worker)
