<div align="center">

# twelve

### Access more. Subscribe less.

A **dark-themed subscription-access marketplace**. People with unused subscription capacity
list temporary access; seekers discover it, book for a fixed window, use a simulated provider
environment, and **lose access automatically when the booking expires**.

**Entertainment** 🎬 · **Education** 🎓 · **AI Models** 🤖 — built for a global audience.

</div>

---

> [!IMPORTANT]
> **Prototype / college MVP.** twelve accounts use real, securely-hashed passwords, but **no
> provider passwords, OTPs or cookies** (Netflix, Spotify, etc.) are ever collected or shared —
> provider authorization is **simulated**. Real-world brand names appear as original stylized
> wordmarks and generated artwork for demonstration only. twelve has **no affiliation** with any
> provider, and **no copyrighted logos, posters or model outputs are reproduced**.

## Table of contents

- [What is twelve?](#what-is-twelve)
- [Key features](#key-features)
- [Quick start](#quick-start)
- [Hosting it locally](#hosting-it-locally-real-accounts)
- [Pricing & currency model](#pricing--currency-model)
- [The temporary-access flow](#the-temporary-access-flow)
- [Authentication & database](#authentication--database)
- [Resetting the database](#resetting-the-database)
- [Demo walkthroughs](#demo-walkthroughs)
- [Tech stack](#tech-stack)
- [Project structure](#project-structure)
- [API reference](#api-reference)
- [Design language](#design-language)
- [Environment variables](#environment-variables)

---

## What is twelve?

Millions of people pay for subscriptions they only half-use. **twelve** turns that unused
capacity into a two-sided marketplace:

- **Owners** list temporary access to a subscription they already pay for and earn a share
  each time someone books it.
- **Seekers** book access for exactly the window they need — an hour, a day, a week — at a
  price far below a full monthly plan, and access ends **automatically** when the window closes.

Everything is wired end to end: real accounts, a real wallet with a ledger, held payments, a
two-party access handshake, duration-tiered settlement, and live auto-expiring bookings.

## Key features

- 🛒 **Real two-sided marketplace** — listings and bookings are per-user and stored in a database;
  a listing one member publishes is instantly discoverable and bookable by everyone else.
- 🔐 **Real authentication** — Express + SQLite, bcrypt-hashed passwords, and a signed JWT
  session in an httpOnly cookie. Optional Google Sign-In.
- 💳 **twelve Wallet** — every account has a real balance and a full ledger of holds, refunds,
  settlements and top-ups (new accounts seeded with **$60** of demo credit).
- 🤝 **Escrow-style hold + two-party handshake** — booking holds the money, opens a private setup
  chat, and only releases access when **both** buyer and owner confirm.
- ⏳ **Automatic expiration** — live countdowns survive refreshes; access is revoked and payment
  settled the moment the window ends.
- 📊 **Duration-tiered settlement** — the owner's share grows with longer bookings; twelve's fee
  shrinks; a fixed provider reserve is always set aside.
- 🌍 **Global-ready pricing** — one canonical USD price with a country selector for local display
  currency (₹, £, €, ¥, …).
- 🎨 **Zero copyrighted assets** — every logo is an original CSS/SVG wordmark; every "poster" is
  generated from layered gradients.

## Quick start

```bash
npm install
npm run dev
```

`npm run dev` starts **both** processes together:

| Process | URL | Purpose |
|---|---|---|
| React app (Vite) | http://localhost:5173 | The UI you open |
| API server (Express) | http://localhost:3001 | Auth, marketplace, wallet |

Open **http://localhost:5173**. In dev, Vite proxies `/api` calls to the Express server, so
requests are same-origin and the session cookie works with no CORS setup.

> **Requirements:** Node.js 18+ (for `node --watch` and native SQLite bindings).

## Hosting it locally (real accounts)

To let other people sign up and log in, build the app and serve it from the Node server:

```bash
npm install
npm run build
npm start
```

`npm start` runs the Express server, which serves the **built app and the API from one origin**
at http://localhost:3001. The data lives in **PostgreSQL** — locally, point `DATABASE_URL` at a
Postgres on your machine; in production, at a free [Supabase](https://supabase.com) database (see
[Deploying](#deploying-vercel--supabase)). Run `npm run migrate` once to create the tables.

> Want just the frontend? `npm run build && npm run preview`.

## Pricing & currency model

- Every price is derived from the provider's real **monthly plan price in India** — the same
  value worldwide, with no per-country re-pricing.
- Internally, **all money is USD** — the canonical unit for the Wallet, ledger and settlement.
- The **country selector** only converts that value into a local **display currency**
  (₹, £, €, ¥, …); the default is **USD**.
- A booking's buyer price follows a **convex short-term-rental curve**: short bookings carry a
  convenience premium, while multi-day bookings taper toward — but always stay below — the full
  monthly plan.

## The temporary-access flow

The signature twelve flow — **hold the money, set up access in a private chat, then settle or
refund** — is fully implemented end to end:

1. **twelve Wallet** — every account has a real balance (seeded with **$60** of demo credit; top
   up any time on the **Wallet** page). Every hold, refund, settlement and top-up is recorded.

2. **Book Now → payment held** — on a listing, **Book Now** holds the price from the buyer's
   Wallet (debited immediately but *not* released) and opens a **private setup chat** between
   buyer and owner with a **10-minute window**. (A classic card checkout is available under *Pay
   another way*; paying by Wallet there routes through the same hold + chat.)

3. **Setup chat + mutual confirmation** — a booking-scoped thread only the two parties can read.
   Access starts on a **two-party handshake**:
   - the **owner** shares access and marks *"I've shared access"*,
   - the **buyer** marks *"I'm in — confirm access"*,
   - and **only when both sides confirm** does the booking go **ACTIVE** and the paid-for usage
     period (and the settlement clock) begin.

   Neither party alone can start the clock — this is **enforced on the server**, with each side's
   attestation recorded and timestamped. For demo-catalog listings (no real owner), the buyer's
   confirmation alone suffices. **Setup failure** or a timeout cancels the booking and **refunds
   the full amount**; the listing becomes available again.

4. **Expiration & settlement** — when the usage period ends (or the buyer ends it early), the held
   payment is settled on a **duration-tiered split**. The **provider reserve is always 20%**
   (a hypothetical share for the real provider, e.g. Netflix); the owner's share grows with longer
   bookings as twelve's fee shrinks:

   | Access window | Owner | twelve | Provider reserve |
   |---|---|---|---|
   | ≤ 12 hours | 30% | 50% | 20% |
   | 24 hours | 35% | 45% | 20% |
   | 3 days | 40% | 40% | 20% |
   | ≥ 7 days | 45% | 35% | 20% |

Timeouts and expirations are reconciled **lazily on read** (no background worker): reading a held
booking past its window auto-fails and refunds it; reading an active booking past its expiry
settles it. Owners see incoming **Setup requests** and live bookings on their **Dashboard**;
buyers see **Awaiting setup**, **Active**, and **Refunded** bookings under **My bookings**.

## Authentication & database

Real, server-backed auth — **Express + PostgreSQL (`pg`)**, passwords hashed with **bcrypt
(cost 12)**, and a signed **JWT session in an httpOnly cookie** (JavaScript can't read it). Auth
endpoints live under `/api/auth`. All account pages (Dashboard, Bookings, Profile, Connect, Create
listing, Earnings, Checkout, Wallet, Setup chat) require a valid session.

**Multi-user marketplace (real, per-user data).** Listings and bookings live in the database, tied
to each user:

- **Your dashboard** shows only *your* listings, *your* earnings and the bookings on *your*
  listings — a brand-new account starts empty, greeted by your own name.
- **Discover** shows the bundled demo catalog **plus** everything real members post (a "New from
  members" row), so a member's listing is visible and bookable by everyone.
- **Two-sided:** booking a member's listing credits that owner's earnings (a duration-tiered
  share); booking a demo-catalog listing goes only to the booker (those owners aren't real
  accounts).

**Sign-in methods:**

- **Email / password** — works out of the box, no configuration needed.
- **Google Sign-In** — works once you add a free Google OAuth Client ID:
  1. Copy `.env.example` to `.env`.
  2. Create a **Web** OAuth Client ID at <https://console.cloud.google.com/apis/credentials> and
     add `http://localhost:5173` and `http://localhost:3001` as *Authorized JavaScript origins*.
  3. Paste the Client ID into **both** `GOOGLE_CLIENT_ID` and `VITE_GOOGLE_CLIENT_ID`, then
     restart. The real Google button appears automatically.
- **Third-party SSO** beyond Google is intentionally left out for now — additional providers need
  paid developer accounts and an HTTPS domain, so they aren't usable on a plain local server yet.

> [!WARNING]
> Never commit `.env` or `server/data/` — both are already git-ignored.

## Resetting the database

To wipe **all** accounts, listings and bookings, run:

```bash
npm run reset-db
```

It asks for confirmation, then drops every table in the database and recreates them empty.
(Add `-- --yes` to skip the prompt.) To only create missing tables without wiping, use
`npm run migrate`.

To restore only the in-app **demo** seed data between run-throughs, use **Reset demo** on the
Dashboard or Profile page.

## Demo walkthroughs

- **Entertainment 🎬** — Landing → Explore → Netflix Premium → 24 Hours ($4.99) → checkout
  (simulated UPI/Card) → success → live countdown → **Open Service** → Netflix-style demo → expiry
  → Completed → Owner Dashboard shows the owner's share.
- **AI Models 🤖** — book ChatGPT Plus / Claude Pro / Gemini → **Open Service** → a ChatGPT-style
  chat environment with the twelve access strip + countdown (responses are generic placeholders).
- **Education 🎓** — book Coursera / Udemy / MasterClass → a course dashboard with a
  remaining-time bar.

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite 5, React Router 6 |
| State | Single `AppContext`, persisted to `localStorage` (countdowns & auto-expiry survive refreshes) |
| Backend | Node.js, Express 5 (Vercel serverless function in production) |
| Database | PostgreSQL via `pg` (Supabase-hosted in production) |
| Auth | bcryptjs, jsonwebtoken (JWT), `google-auth-library`, httpOnly cookies |
| Tooling | `concurrently`, `@vitejs/plugin-react` |

## Project structure

```
twelve/
├─ index.html               App shell (Inter font, black theme-color)
├─ vite.config.js           Vite config + /api proxy to the Express server
├─ .env.example             Copy to .env for JWT secret & Google OAuth
│
├─ vercel.json              Vercel build + API/SPA routing
├─ api/
│  └─ index.js              Vercel serverless entry (exports the Express app)
│
├─ server/                  Express + PostgreSQL backend
│  ├─ app.js                The Express app (shared by local server + Vercel)
│  ├─ index.js              Local entry: starts app.js on a port
│  ├─ auth.js               Signup / login / google / logout / me
│  ├─ market.js             Listings, dashboard, bookings, setup, settlement
│  ├─ wallet.js             Balance, ledger, top-ups
│  ├─ db.js                 Postgres pool, query helpers, schema
│  ├─ migrate.js            Create the tables (npm run migrate)
│  └─ reset-db.js           Wipe the database (npm run reset-db)
│
├─ public/                  Static assets (favicon, original SVG wordmarks)
│
└─ src/
   ├─ App.jsx               Routes + RequireAuth session gate
   ├─ main.jsx              React entry
   ├─ data/                 providers (ent/edu/ai), listings (USD), content, brand assets
   ├─ store/                AppContext (bookings, stats, toasts, expiry engine)
   ├─ lib/                  currency, pricing, geo, time/countdown, format, avatar helpers
   ├─ components/           Navbar, Footer, cards, countdown ring/pill, search, toasts, …
   └─ pages/                Landing, Discover, ListingDetails, Checkout, Success, SetupChat,
                            Wallet, AccessScreen, Dashboard, Connect, CreateListing, Earnings,
                            Bookings, Profile, HowItWorks, Auth
```

The provider "environments" are a separated **simulation layer**, so real integrations (official
APIs / OAuth / delegated access) could be added later without touching the marketplace UI.

## API reference

All routes are served under one origin. In dev, Vite proxies them to `http://localhost:3001`.

| Group | Endpoints |
|---|---|
| **Health** | `GET /api/health` |
| **Auth** (`/api/auth`) | `POST /signup` · `POST /login` · `POST /google` · `POST /logout` · `GET /me` |
| **Wallet** (`/api/wallet`) | `GET /api/wallet` · `POST /api/wallet/topup` |
| **Marketplace** (`/api`) | `GET /listings` · `GET /me/dashboard` · `GET /me/bookings` · `POST /bookings` (`hold: true`) |
| **Booking lifecycle** | `GET/POST /bookings/:id/messages` · `POST /bookings/:id/confirm-setup` · `POST /bookings/:id/fail-setup` · `POST /bookings/:id/end` |

## Design language

A clean, **black-dominant** aesthetic — minimal chrome, lots of contrast, and the content doing
the talking:

- **Typography** — Inter.
- **Surfaces** — pure-black backgrounds; provider artwork supplies the color.
- **Accent** — a single blue (`#2997ff` / `#0071e3`).
- **Controls** — pill buttons and `›` text links.

## Environment variables

Copy `.env.example` to `.env` and fill in as needed:

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | **Yes** | Postgres connection string. Local Postgres for dev; the Supabase **Transaction pooler** URI in production. |
| `PORT` | No | Local API/server port (default `3001`). Ignored on Vercel. |
| `JWT_SECRET` | Local: No / **Vercel: Yes** | Secret for signing sessions. Locally, leave blank to auto-generate one (saved to `server/data/.jwt-secret`). On Vercel you **must** set a fixed value, or cold starts log everyone out. |
| `GOOGLE_CLIENT_ID` | No | Google OAuth Web Client ID (server side). Enables Google Sign-In. |
| `VITE_GOOGLE_CLIENT_ID` | No | Same Client ID, exposed to the frontend. Must match `GOOGLE_CLIENT_ID`. |
| `COOKIE_SECURE` | No | Set to `true` when serving over HTTPS. Use `false` locally, `true` on Vercel. |

## Deploying (Vercel + Supabase)

The frontend and the Express API deploy together to **Vercel** (the API runs as a serverless
function at `api/[...path].js`); the database is **Supabase** (hosted Postgres). Both have free tiers.

1. **Create the database (Supabase).**
   - Sign up at [supabase.com](https://supabase.com) → **New project**. Choose a strong database
     password and save it.
   - Open **Connect** (top bar) → **ORMs / Connection string** → copy the **Transaction pooler**
     URI (host ends in `...pooler.supabase.com`, port `6543`). Replace `[YOUR-PASSWORD]` with your
     database password. This is your `DATABASE_URL`.

2. **Create the tables.** With that URL in your local `.env`, run once:
   ```bash
   npm install
   npm run migrate
   ```

3. **Configure Vercel.** In your Vercel project → **Settings → Environment Variables**, add:
   - `DATABASE_URL` — the Supabase Transaction pooler URI
   - `JWT_SECRET` — any long random string (e.g. `openssl rand -hex 32`)
   - `COOKIE_SECURE` — `true`
   - `GOOGLE_CLIENT_ID` and `VITE_GOOGLE_CLIENT_ID` — only if you use Google Sign-In (also add your
     `https://<your-app>.vercel.app` origin in the Google Cloud console)

4. **Deploy.** Push to GitHub; Vercel builds the frontend and the API function automatically. Your
   app and its `/api` share one origin, so the login cookie works with no extra config.

> Free-tier note: Supabase pauses a project after long inactivity — the first request afterwards
> may be slow while it wakes. Opening the Supabase dashboard resumes it.

---

<div align="center">

Built as a college MVP · **twelve — Access more. Subscribe less.**

</div>
