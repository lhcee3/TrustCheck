# XpressBank — Architecture Reference

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.2.3 — App Router, Turbopack |
| UI | React 19, TypeScript, Tailwind CSS v4 |
| Icons | lucide-react v1.8 |
| Package manager | bun |
| Database | JSON files on disk (no external DB) |
| Deployment | Vercel — root directory: `trustcheck/`, zero env vars |
| PWA | Web App Manifest + Service Worker |

---

## Project Structure

```
trustcheck/
├── app/
│   ├── layout.tsx                     # Root layout — manifest link, theme-color meta, SW meta tags, Geist font
│   ├── globals.css                    # Tailwind v4 import, safe-area-bottom, scrollbar-hide, desktop grey bg
│   ├── page.tsx                       # Landing page — PWA install prompt, iOS bottom sheet, notification enable
│   ├── xpressbank/
│   │   ├── layout.tsx                 # "use client" — registers SW on mount, plain div wrapper
│   │   ├── page.tsx                   # redirect → /xpressbank/login
│   │   ├── login/page.tsx             # Auth form → POST /api/auth/login → localStorage
│   │   ├── dashboard/page.tsx         # DUAL LAYOUT: mobile (sm:hidden) + desktop (hidden sm:flex)
│   │   ├── transactions/page.tsx      # Search + filter tabs, full transaction list
│   │   ├── profile/page.tsx           # User info, stats, security toggles, push notification
│   │   ├── contacts/page.tsx          # Contact list, add/delete, pay button → SendMoneyModal
│   │   ├── notifications/page.tsx     # Notification list, mark read
│   │   └── send-money/page.tsx        # redirect → /xpressbank/dashboard
│   └── api/
│       ├── auth/login/route.ts        # POST — credential check against users.json
│       ├── user/route.ts              # GET, PATCH — read/update Ramesh's user record
│       ├── transactions/route.ts      # GET (filter/search/limit), POST (create + deduct balance)
│       ├── transactions/[id]/route.ts # GET single, PATCH status
│       ├── contacts/route.ts          # GET all, POST create
│       ├── contacts/[id]/route.ts     # DELETE, PATCH (lastPaid + totalPaid)
│       ├── notifications/route.ts     # GET sorted, PATCH markAllRead
│       ├── notifications/[id]/route.ts# PATCH mark single read
│       ├── risk-score/route.ts        # POST — full risk analysis, writes fraud notification if flagged
│       ├── record-incoming/route.ts   # POST — records received tx + increments balance
│       ├── check-account/route.ts     # GET+POST — scam DB lookup, returns recommendation
│       ├── check-recipient/route.ts   # POST — legacy compat wrapper around scam DB
│       └── check-link/route.ts        # GET+POST — parallel OpenPhish + PhishTank URL check
├── components/
│   ├── Navbar.tsx                     # Dark TrustCheck nav — NOT used in xpressbank
│   ├── WarningScreen.tsx              # Full-screen red warning with 30s countdown (legacy)
│   └── xpressbank/
│       ├── SendMoneyModal.tsx         # Full send flow: UPI input → risk check → warning → POST /api/transactions
│       ├── TrustCheckWarning.tsx      # Fraud warning modal: risk score, reasons, CooldownTimer, checkbox
│       ├── CooldownTimer.tsx          # SVG circular countdown, red→orange at 10s, onTick callback
│       ├── BalanceCard.tsx            # Reusable card (unused by dashboard, available)
│       ├── RecentTransactions.tsx     # Transaction list component with mock data (unused by dashboard)
│       └── BottomNav.tsx              # Shared mobile bottom nav (created, not yet wired to all pages)
├── lib/
│   ├── dataStore.ts                   # readData<T> / writeData<T> — Vercel /tmp seeding logic
│   ├── api.ts                         # Typed fetch helpers for all API routes + TypeScript interfaces
│   ├── formatters.ts                  # formatCurrency, formatRelativeTime, getInitials
│   ├── trustcheckAgent.ts             # In-memory rule-based risk engine
│   ├── mockData.ts                    # Loads scam-accounts.json — findAccountByUpiId()
│   ├── openphish.ts                   # Mock phishing URL checker — checkOpenPhish(url)
│   └── phishtank.ts                   # Mock phishing URL checker — checkPhishTank(url)
├── data/
│   ├── users.json                     # 1 user: Ramesh Kumar
│   ├── transactions.json              # 40 transactions (salary, rent, food, blocked scams)
│   ├── contacts.json                  # 10 saved contacts
│   ├── notifications.json             # 8 notifications (fraud alerts, tx confirmations, system)
│   └── scam-accounts.json             # 34 scam UPI IDs + 15 safe UPI IDs
├── public/
│   ├── manifest.json                  # PWA manifest — theme #2D6A4F, start_url /xpressbank/login
│   ├── sw.js                          # Service worker — push, notificationclick, install, activate
│   ├── icon-192.png                   # PWA icon (missing — needs generate-icons.js)
│   └── icon-512.png                   # PWA icon (missing — needs generate-icons.js)
├── scripts/
│   ├── test-apis.js                   # Node script — tests all API routes against localhost:3000
│   └── generate-icons.js              # Generates icon-192.png + icon-512.png using canvas
├── vercel.json                        # { outputDirectory: ".next", framework: "nextjs" }
├── next.config.ts                     # Empty config
├── package.json                       # next 16.2.3, react 19, tailwindcss 4, lucide-react, jspdf, axios
└── tsconfig.json                      # paths: @/* → ./*
```

---

## Data Layer

### Storage Strategy

All data lives in JSON files under `data/`. The `lib/dataStore.ts` utility handles all reads and writes:

```
Local dev  →  reads/writes directly from  data/*.json
Vercel     →  on first access, copies data/*.json → /tmp/xpressbank-data/
             all subsequent reads/writes go through /tmp/
```

This is necessary because Vercel's filesystem is read-only except for `/tmp`.

### `readData<T>(filename)` / `writeData<T>(filename, data)`

Every API route uses these two functions. They never cache — always read fresh from disk.

### Data Files

**`users.json`** — array of 1 user
```
id, name, email, passwordHash, phone, upiId, accountNumber, ifsc,
branch, accountType, balance, avatarInitials, joinedDate, kycStatus,
linkedCards[{ last4, network, expiry }]
```

**`transactions.json`** — array of 40 transactions
```
id, userId, type (sent|received|blocked), amount, recipientName,
recipientUpi, senderName, senderUpi, note,
category (food|transport|shopping|utilities|transfer|salary|rent),
timestamp (ISO), status (success|blocked), riskScore (0-100),
trustCheckFlagged (bool)
```

**`contacts.json`** — array of 10 contacts
```
id, userId, name, upiId, bank, avatarInitials, lastPaid, totalPaid
```

**`notifications.json`** — array of 8 notifications
```
id, userId, type (alert|transaction|system), title, body, read, timestamp
```

**`scam-accounts.json`** — static lookup table (never written to)
```
scamAccounts[{ upiId, accountNumber, ifsc, complaints, riskScore }]  — 34 entries
safeAccounts[{ upiId, accountNumber, ifsc, complaints, riskScore }]  — 15 entries
```

---

## API Routes

All routes are under `app/api/`. All use `readData`/`writeData` from `lib/dataStore.ts`. All hardcode `userId: "user_ramesh_001"` (single-user app).

### Auth

| Route | Method | Input | Output |
|---|---|---|---|
| `/api/auth/login` | POST | `{ email, password }` | `{ success, user }` or `{ success: false, error }` 401 |

Compares plain-text password against `passwordHash` field. Returns user object minus `passwordHash`.

### User

| Route | Method | Input | Output |
|---|---|---|---|
| `/api/user` | GET | — | User object (no passwordHash) |
| `/api/user` | PATCH | `{ balance?, phone?, name? }` | Updated user object |

### Transactions

| Route | Method | Input | Output |
|---|---|---|---|
| `/api/transactions` | GET | `?type=sent\|received\|blocked`, `?search=`, `?limit=n` | `Transaction[]` sorted by timestamp desc |
| `/api/transactions` | POST | `{ recipientUpi, recipientName, amount, note, category, riskScore?, trustCheckFlagged? }` | `{ transaction, newBalance }` 201 |
| `/api/transactions/[id]` | GET | — | Single transaction |
| `/api/transactions/[id]` | PATCH | `{ status }` | Updated transaction |

POST also deducts `amount` from `users.json` balance atomically (read → subtract → write).

### Contacts

| Route | Method | Input | Output |
|---|---|---|---|
| `/api/contacts` | GET | — | `Contact[]` |
| `/api/contacts` | POST | `{ name, upiId, bank? }` | New contact 201 |
| `/api/contacts/[id]` | DELETE | — | `{ success: true }` |
| `/api/contacts/[id]` | PATCH | `{ lastPaid?, amount? }` | Updated contact (increments totalPaid) |

### Notifications

| Route | Method | Input | Output |
|---|---|---|---|
| `/api/notifications` | GET | — | `Notification[]` sorted by timestamp desc |
| `/api/notifications` | PATCH | `{ markAllRead: true }` | Updated `Notification[]` |
| `/api/notifications/[id]` | PATCH | `{}` | Updated notification with `read: true` |

### Risk & Fraud

| Route | Method | Input | Output |
|---|---|---|---|
| `/api/risk-score` | POST | `{ upiId, amount?, userId?, record? }` | `{ riskScore, level, reasons[], flagged, reason }` |
| `/api/check-account` | GET/POST | `upiId` | `{ found, riskScore, complaints, recommendation }` |
| `/api/check-recipient` | POST | `{ upiId, amount? }` | `{ flagged, riskScore, reason }` |
| `/api/check-link` | GET/POST | `url` | `{ url, riskScore, sources, recommendation }` |
| `/api/record-incoming` | POST | `{ userId, sender, amount, senderName? }` | `{ ok: true }` |

`/api/risk-score` also writes a fraud alert notification to `notifications.json` when `flagged: true`.

`/api/record-incoming` writes a `type: "received"` transaction to `transactions.json` and increments the user's balance.

---

## Risk Engine (`lib/trustcheckAgent.ts`)

Pure in-memory, rule-based. No ML. Resets on server restart (fine for demo).

**Input:** `{ userId, upiId, amount, recipientRiskScore, recipientComplaints, recipientFound }`

**Output:** `{ riskScore: 0–100, level: "low"|"medium"|"high", reasons: string[], flagged: boolean }`

`flagged = true` when `level === "high"` (score ≥ 70).

### Scoring Rules

| Signal | Score |
|---|---|
| UPI found in scam DB | +50 |
| Scam DB complaints > 10 | +20 |
| Suspicious keyword in UPI ID | +10 |
| First-time recipient (not in knownRecipients) | +20 |
| Amount > 2× user's average transaction | +20 |
| Late night (18:30–23:30 UTC = midnight–5AM IST) | +10 |
| Refund scam pattern (received money ≤30min ago, now sending to different UPI) | +40 |

**Suspicious keywords:** refund, kyc, verify, update, alert, helpdesk, support, reward, prize, lottery, loan, credit, cashback, cbi, police, rbi, income, tax, customs, parcel, arrest

**Per-user in-memory profile:**
```
avgAmount       — rolling average of sent amounts
txCount         — total transactions recorded
knownRecipients — UPI IDs previously paid safely
lastIncoming    — { sender, amount, timestamp } for refund scam detection
txHistory       — last 50 transactions
```

---

## Frontend Pages

### Login (`/xpressbank/login`)

- Calls `POST /api/auth/login`
- On success: saves `xb_loggedIn = "true"` and `xb_user = JSON.stringify(user)` to localStorage
- Shows inline red error text on failure (no `alert()`)
- Spinner on submit button during fetch
- Redirects to dashboard if already logged in

### Dashboard (`/xpressbank/dashboard`)

Two completely separate layouts in one file, toggled by Tailwind breakpoint:

**Mobile** (`sm:hidden`):
- Green header with balance hero card, eye toggle, monthly spend + savings goal mini-cards
- 4-column quick action buttons (Send, Request, Scan, History)
- UPI ID copy card
- Recent Activity list (last 5 transactions)
- Spending Insights donut chart
- Fixed bottom nav (5 tabs: Home, History, Send, Contacts, Profile)
- Send tab opens SendMoneyModal (no navigation)

**Desktop** (`hidden sm:flex`):
- Top navbar: logo, fraud badge, user name, nav links, bell with unread count, avatar, logout
- 3-column balance cards (Total Balance, Monthly Spend, Savings Goal)
- 4-column quick action cards
- 2/3 + 1/3 grid: transaction table left, spending donut + UPI card right

**Data fetched on mount:**
- `GET /api/user` → balance (synced back to localStorage)
- `GET /api/transactions?limit=20` → recent activity + spending chart
- `GET /api/notifications` → unread count badge

### Transactions (`/xpressbank/transactions`)

- Fetches `GET /api/transactions` on mount
- Search input: 300ms debounce → `GET /api/transactions?search=<term>`
- Filter tabs: All / Sent / Received / Blocked → `GET /api/transactions?type=<type>`
- Blocked transactions: red badge, strikethrough amount
- Shows total count in header

### Profile (`/xpressbank/profile`)

- Fetches `GET /api/user` + `GET /api/transactions` in parallel
- Displays all user fields from API (no hardcoded values)
- Computes stats: total tx count, total sent sum, total received sum
- Security toggles (UI only — fraud protection, risk alerts)
- Push notification enable button → `Notification.requestPermission()`
- Logout clears localStorage

### Contacts (`/xpressbank/contacts`)

- Fetches `GET /api/contacts` on mount
- Client-side search filter (name + UPI)
- Add contact form → `POST /api/contacts`
- Delete → `DELETE /api/contacts/[id]`
- Pay button → opens SendMoneyModal pre-filled with contact's UPI + name
- On successful send → `PATCH /api/contacts/[id]` to update lastPaid

### Notifications (`/xpressbank/notifications`)

- Fetches `GET /api/notifications` on mount
- Click notification → `PATCH /api/notifications/[id]` (mark read)
- Mark all read → `PATCH /api/notifications` with `{ markAllRead: true }`
- Type icons: 🚨 alert, 💸 transaction, ℹ️ system

---

## Send Money Flow

```
User types UPI ID
    ↓ (500ms debounce)
POST /api/risk-score → { riskScore, level, reasons, flagged }
    ↓
[flagged = false]              [flagged = true]
    ↓                               ↓
User clicks Send            TrustCheckWarning modal opens
    ↓                               ↓
POST /api/transactions      30s CooldownTimer + checkbox
    ↓                               ↓
Balance deducted            [Cancel] → abort
Transaction written         [Continue after 30s + checkbox]
onSuccess(newBalance)               ↓
Balance updated in UI       POST /api/transactions (trustCheckFlagged: true)
```

**Inline validations before API call:**
- `amount > localStorage balance` → "Insufficient balance" error (no API call)
- `checking === true` → button disabled (wait for risk check)

---

## Components

### `SendMoneyModal`

Props: `{ onClose, onSuccess(newBalance?), onFraudPrevented, prefillUpi?, prefillName? }`

- `prefillUpi` / `prefillName` used when opened from Contacts page
- `recipientName` in transaction payload = `prefillName || upiId`
- Risk check fires on UPI input change (debounced 500ms) AND on amount change
- Shows risk score bar, reasons list, color-coded input border

### `TrustCheckWarning`

Props: `{ riskScore, level, reasons[], onCancel, onContinue }`

- Red header for `high`, amber for `medium`
- `CooldownTimer` with `onTick` callback → live countdown in button label
- Checkbox: "I confirm this is NOT a scam..."
- Continue button disabled until: timer reaches 0 AND checkbox checked

### `CooldownTimer`

Props: `{ initialSeconds?, onComplete, onTick? }`

- SVG circular progress ring
- Stroke color: red (`#ef4444`) above 10s, orange (`#f97316`) at 10s and below
- `onTick(seconds)` fires every second so parent can display the number

---

## Auth & Session

No JWT, no cookies, no server-side sessions. Pure localStorage:

```
xb_loggedIn = "true"          — presence check on every protected page
xb_user     = JSON string     — { id, name, email, upiId, accountNumber, balance, avatarInitials, ... }
```

Every protected page checks `localStorage.getItem("xb_loggedIn") !== "true"` in `useEffect` and redirects to `/xpressbank/login` if missing.

Balance in localStorage is synced from API on every dashboard load.

---

## PWA

| File | Purpose |
|---|---|
| `public/manifest.json` | name, short_name, theme_color `#2D6A4F`, background_color `#F7F6F2`, display: standalone, start_url: `/xpressbank/login`, icons 192+512 |
| `public/sw.js` | Handles `push` (show notification), `notificationclick` (focus/open app), `install` (skipWaiting), `activate` (claim clients) |
| `app/layout.tsx` | `<link rel="manifest">`, `<meta name="theme-color">`, apple-mobile-web-app meta tags |
| `app/xpressbank/layout.tsx` | Registers SW via `navigator.serviceWorker.register("/sw.js")` |
| `app/page.tsx` | Captures `beforeinstallprompt` for Android Chrome native install dialog. iOS: shows 3-step bottom sheet (Share → Add to Home Screen → Add) |

**Icons:** `icon-192.png` and `icon-512.png` are referenced but not generated. Run `node scripts/generate-icons.js` after `bun add canvas` to create them.

---

## Lib Utilities

### `lib/api.ts` — typed fetch helpers

All functions throw on non-OK responses. Used exclusively in client components.

```typescript
api.getUser()
api.updateUser(body)
api.getTransactions({ type?, search?, limit? })
api.createTransaction({ recipientUpi, recipientName, amount, note?, category?, riskScore?, trustCheckFlagged? })
api.getContacts()
api.createContact({ name, upiId, bank? })
api.deleteContact(id)
api.updateContact(id, { lastPaid?, amount? })
api.getNotifications()
api.markAllNotificationsRead()
api.markNotificationRead(id)
api.getRiskScore({ upiId, amount?, userId? })
api.login(email, password)
```

### `lib/formatters.ts`

```typescript
formatCurrency(amount)       // "₹84,320.50" — en-IN locale, 2 decimal places
formatRelativeTime(iso)      // "Just now" | "5m ago" | "3h ago" | "Yesterday" | "3 days ago" | "Apr 12"
getInitials(name)            // "Ramesh Kumar" → "RK"
```

### `lib/mockData.ts`

Loads `scam-accounts.json` into memory (cached after first read).

```typescript
findAccountByUpiId(upiId)    // { found, isScam, riskScore, complaints }
getRiskScore(upiId)          // { riskScore, complaints, found }
```

---

## Test Credentials & UPI IDs

```
Email:    test@gmail.com
Password: Password
```

| UPI ID | Expected Result |
|---|---|
| `scammer@okhdfcbank` | 🔴 HIGH — in scam DB, 12 complaints |
| `kyc-update@sbi` | 🔴 HIGH — keyword "kyc" + DB, 88 complaints |
| `bank-upgrade@okhdfc` | 🔴 HIGH — 500 complaints, score 99 |
| `rbi-notice@paytm` | 🔴 HIGH — keyword "rbi", 110 complaints |
| `digital-arrest@axis` | 🔴 HIGH — keyword "arrest", 31 complaints |
| `friend@okicici` | 🟢 LOW — safe list |
| `priya@okicici` | 🟢 LOW — safe list (known contact) |
| `amazon@apl` | 🟢 LOW — safe list |
| `newperson@upi` | 🟡 MEDIUM — first-time recipient (+20) |

---

## Known Issues

| Issue | Detail |
|---|---|
| PWA icons missing | `icon-192.png` / `icon-512.png` not in `/public`. Run `node scripts/generate-icons.js` after `bun add canvas` |
| `xpressbank-mobile/` folder | Leftover Expo scaffold in workspace root. File-locked on Windows, can't delete. Irrelevant to this project |
| `components/Navbar.tsx` | Dark TrustCheck navbar — exists but unused in xpressbank |
| `components/WarningScreen.tsx` | Legacy full-screen warning — superseded by `TrustCheckWarning.tsx` modal |
| `components/xpressbank/RecentTransactions.tsx` | Contains hardcoded `MOCK_TRANSACTIONS` — not used by dashboard (dashboard renders inline) |
| `components/xpressbank/BalanceCard.tsx` | Uses `bg-linear-to-br` (invalid Tailwind v4, should be `bg-gradient-to-br`) — not used by dashboard |
| `trustcheckAgent.ts` in-memory profiles | Reset on every Vercel cold start. Refund scam detection and avg-amount signals won't persist across requests |
