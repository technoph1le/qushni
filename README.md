# Qo'shni

Roommate and room finder for Uzbekistan — a **Mir2Dos** product. Hosts post a free room or bed; students, workers and families find a place and contact the host directly. The interface is in Uzbek, Russian and English.

One **Next.js** app: the website and its API (Telegram sign-in, payments) deploy together to **Vercel**, with **Supabase** for the database, file storage and Google sign-in.

## Quick start

```bash
npm run setup   # once: installs packages and creates .env.local
npm run dev     # starts the site and a shareable tunnel link
```

- Local: http://localhost:5173
- **Share link:** printed in the terminal. It works on any device while your terminal is running.
- Fill `.env.local` first (see **[docs/SETUP.md](docs/SETUP.md)**). The share link and Telegram sign-in need [cloudflared](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/) installed once. `npm run dev -- --no-tunnel` runs without it.

Other commands: `npm run build`, `npm test` (payment and phone-number tests), `npm run typecheck`.

**Going live:** [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

## How it fits together

```
Browser ──► Next.js on Vercel
              ├─ pages: rendered on the server (listings visible to Google and Telegram previews)
              └─ /api/*: Telegram sign-in, bot webhook, Payme & Click callbacks
   │                     └──► Supabase (secret key) and Telegram Bot API
   └──► Supabase directly: listings, photos, Google sign-in, contact access rules
```

**Contact privacy is enforced in the database:** exact addresses and phone numbers can only be read through functions that check the paywall and the user's plan, whatever the website does.

## Where things are

```
src/
  app/                       Next.js routes — thin files that load data and pick a view
    (site)/                  Public pages with header and footer: home, listing/[id], saved, privacy, terms, payment/return
    dashboard/               Host dashboard routes (overview, listings, new, edit/[id], profile)
    login/                   Sign-in page
    api/[[...route]]/        Hands every /api request to the server app in src/server
    layout.tsx               Fonts, page metadata, icons, language
    providers.tsx            Browser-side setup: language, sign-in state, saved favourites
    robots.ts, sitemap.ts    Generated robots.txt and sitemap.xml
  views/                     The page components themselves (HomePage, ListingPage, LoginPage, dashboard/…)
  features/                  Logic and UI grouped by feature
    auth/                    Sign-in state (AuthProvider) and the Telegram phone flow
    listings/                Listing card, filters panel and filter logic
    dashboard/               "My listings" table and hooks
    payments/                Plans and checkout modal (Payme / Click)
  components/                Shared building blocks: icons, inputs, header, footer, dialogs
  data/                      repo.ts (browser data access), server.ts (server-side reads), mappers, places
  server/                    API code: runs only on the server
    app.ts                   Routes and rate limits for /api
    routes/                  auth (Telegram sign-in), telegramWebhook, payments
    payments/                Payme and Click protocols (+ tests)
    lib/                     Supabase admin client, Telegram API, login codes, phone rules, rate limiting
  content/legal.ts           Privacy policy and terms text (UZ / RU / EN)
  i18n/                      Translations — en.ts defines the keys; uz.ts and ru.ts must match
  lib/                       Browser Supabase client, local preferences, site URL, helpers
  styles/                    CSS split by area
  config.ts                  Company contacts, plan prices, legal date
public/                      Favicons, app manifest, link-preview image
supabase/migrations/         Database schema and security rules (run in order)
scripts/                     dev runner, .env.local setup, Telegram webhook helper
docs/                        Setup and deployment guides
```

## Common tasks

| I want to… | Look at |
| --- | --- |
| Change text or add a language string | `src/i18n/en.ts` first, then the same key in `uz.ts` and `ru.ts` (type-checked) |
| Add a page | A component in `src/views/`, plus a `page.tsx` in `src/app/(site)/<path>/` |
| Add an API endpoint | `src/server/routes/` and register it in `src/server/app.ts` |
| Change support email, Telegram or company name | `src/config.ts` → `COMPANY` |
| Change plan prices | `plans` table in Supabase **and** `PLANS` in `src/config.ts` |
| Turn paid mode on | Supabase SQL: `update app_settings set paywall_enabled = true;` |
| Add a city, district or metro station | `src/data/places.ts` |
| Change the database | Add a new numbered file in `supabase/migrations/` (never edit applied ones) |
| Edit the privacy policy or terms | `src/content/legal.ts`, then update `LEGAL_UPDATED` in `src/config.ts` |

## Rules worth knowing

- Code in `src/server/` and `src/data/server.ts` imports `server-only`, so it can never end up in the browser bundle. Only `NEXT_PUBLIC_*` variables reach the browser; never give a secret that prefix.
- Only Uzbek (+998) phone numbers can sign up. The website, the API and the database each enforce this.
- Posting a room requires a confirmed phone number. Google users confirm theirs once in the dashboard.
- Hosts never pay. Seekers can always browse for free; paid plans (7 days, 10 days, 1 month) unlock contacts once the paywall is switched on.
