# Qo'shni

Roommate and room finder for Uzbekistan — a **Mir2Dos** product. Hosts post a free room or bed; students, workers and families find a place and contact the host directly. The interface is in Uzbek, Russian and English.

## Quick start

```bash
npm run setup   # once: installs everything and creates frontend/.env and backend/.env
npm run dev     # starts the backend, the website and a shareable tunnel link
```

- Website: http://localhost:5173 (backend on http://localhost:8787)
- **Share link:** printed in the terminal. Teammates can open it on any device while your terminal is running.
- With empty `.env` files the website runs on demo data. To connect real accounts (Supabase, Google, Telegram), follow **[docs/SETUP.md](docs/SETUP.md)**.
- The share link and Telegram phone login need [cloudflared](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/) installed once (`winget install Cloudflare.cloudflared`). `npm run dev -- --no-tunnel` runs without it.

Other commands: `npm run build`, `npm test` (payment and phone tests), `npm run typecheck`.

**Going live:** [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) covers Vercel, Railway and Supabase step by step.

## How it fits together

```
Browser ──► Supabase  listings, photos, Google sign-in, contact access rules
   │
   └──► Backend ──► Telegram Bot API    phone confirmation codes
          ▲   └──► Supabase (service key)
          │
     Payme / Click payment callbacks
```

The website talks to Supabase directly. The backend exists only for work that needs secrets: confirming phone numbers through Telegram, signing users in after that, and receiving payment callbacks. **Contact privacy is enforced in the database:** exact addresses and phone numbers can only be read through functions that check the paywall and the user's plan.

## Where things are

```
frontend/                     Website (Vite + React + TypeScript)
  public/                     Favicons, app manifest, link-preview image, robots.txt
  src/
    app/App.tsx               All routes and page layout
    pages/                    One file per page (HomePage, ListingPage, LegalPage, …)
      dashboard/              Host dashboard pages (overview, listings, listing form, profile)
    features/                 Logic and UI grouped by feature
      auth/                   Sign-in state (AuthProvider) and the Telegram phone flow
      listings/               Listing card, filters panel and filter logic
      dashboard/              "My listings" table and hooks
      payments/               Plans and checkout modal (Payme / Click)
    components/               Shared building blocks: icons, inputs, header, footer, dialogs
    data/                     Data access (repo.ts), cities/districts/metro, demo listings
    content/legal.ts          Privacy policy and terms text (UZ / RU / EN)
    i18n/                     Translations — en.ts defines the keys; uz.ts and ru.ts must match
    lib/                      Supabase client, local storage state, small helpers
    styles/                   CSS split by area (base, components, layout, home, listing, …)
    config.ts                 Company contacts, plan prices, legal date
backend/                      API server (Node + Hono + TypeScript)
  src/
    index.ts                  Server setup: routes, CORS, rate limits
    env.ts                    Reads and checks environment variables
    routes/                   HTTP endpoints: auth (Telegram login), telegramWebhook, payments
    payments/                 Payme and Click protocols (+ tests)
    lib/                      Supabase admin client, Telegram API, login codes, phone rules
  scripts/set-webhook.ts      Points the production bot at the production backend
  Dockerfile                  Used by Railway
supabase/migrations/          Database schema and security rules (run in order)
scripts/                      Root helpers: one-command dev runner, .env setup
docs/                         Setup and deployment guides
```

## Common tasks

| I want to… | Look at |
| --- | --- |
| Change text or add a language string | `frontend/src/i18n/en.ts` first, then the same key in `uz.ts` and `ru.ts` (type-checked) |
| Add a page | Create it in `frontend/src/pages/`, then add a route in `frontend/src/app/App.tsx` |
| Change support email, Telegram or company name | `frontend/src/config.ts` → `COMPANY` |
| Change plan prices | `plans` table in Supabase **and** `PLANS` in `frontend/src/config.ts` |
| Turn paid mode on | Supabase SQL: `update app_settings set paywall_enabled = true;` |
| Add a city, district or metro station | `frontend/src/data/places.ts` |
| Change the database | Add a new numbered file in `supabase/migrations/` (never edit applied ones) |
| Edit the privacy policy or terms | `frontend/src/content/legal.ts`, then update `LEGAL_UPDATED` in `config.ts` |

## Rules worth knowing

- Only Uzbek (+998) phone numbers can sign up. The website, the backend and the database each enforce this.
- Posting a room requires a confirmed phone number. Google users confirm theirs once in the dashboard.
- Hosts never pay. Seekers can always browse for free; paid plans (7 days, 10 days, 1 month) unlock contacts once the paywall is switched on.
