# TrustCheck — Real-Time Fraud Prevention for Indian Banking

Built by **Team Tiger Claw** for hackathon demo purposes.

TrustCheck intercepts UPI payments and link shares in real time, scoring them for fraud risk before money moves.

---

## Features

- **Bank Demo** — Simulated XYZ Bank login + payment flow with live fraud interception
- **Checker Tool** — Manually check any UPI ID or URL for risk, with PDF report export
- **Warning Screen** — 30-second cooldown + confirmation checkbox before a flagged transaction can proceed
- **Risk Scoring** — Combines mock OpenPhish + PhishTank feeds for link checks; complaint database for UPI IDs

## Pages

| Route | Description |
|---|---|
| `/` | Landing page |
| `/bank-demo` | Simulated bank app with fraud detection |
| `/checker` | Manual UPI ID and link checker |
| `/case-study` | Case study writeup |

## API Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/api/check-recipient` | POST | Check if a UPI ID is flagged as a scammer |
| `/api/check-account` | GET/POST | Get risk score and complaint count for a UPI ID |
| `/api/check-link` | GET/POST | Check a URL against phishing feeds |

## Demo Credentials (Bank Demo)

```
Email:    test@gmail.com
Password: Password
```

## Test UPI IDs

| UPI ID | Expected Result |
|---|---|
| `scammer@okhdfcbank` | Flagged — HOLD |
| `fraud@sbi` | Flagged — HOLD |
| `friend@okicici` | Safe — ALLOW |

## Test URLs

| URL | Expected Result |
|---|---|
| `https://example.com` | Safe — ALLOW |
| `https://sbi-update.vercel.app` | Flagged by OpenPhish |
| `https://secure-hdfc-login.com` | Flagged by PhishTank |

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Tech Stack

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS v4
- lucide-react
- jsPDF
