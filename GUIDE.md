# Qo'shni — developer guide

Find a room and roommates in Uzbekistan, ideally with people from your own region. A **Mir2Dos** product.
UI in Uzbek (default), Russian and English. This one file is the whole manual; it lives outside `frontend/` and `backend/`, so it is never deployed.

## How it fits together

```
Browser ──► frontend/ (Next.js, port 5173)
              ├─ pages, rendered on the server (good for Google and Telegram link previews)
              ├─ /api/*  ──►  backend/ code (Hono)
              │                 Telegram sign-in + bot webhook, Payme & Click callbacks
              │                 └──► Supabase with the SECRET key, Telegram Bot API
              └─ Supabase directly with the PUBLIC key: listings, photos, sign-in sessions
```

- The browser, Telegram and the payment providers only ever call `https://<site>/api/...`.
- **Locally** `API_URL=http://localhost:8787` (in `frontend/.env.local`) makes the site proxy `/api/*` to the separate backend process, so it restarts on its own and logs in its own terminal.
- **On Vercel** `API_URL` is left unset and the same backend code runs inside the site via `frontend/src/app/api/[...path]/route.ts`. The frontend's `postinstall` installs `backend/`'s packages for this.
- **Privacy is enforced in the database**, not the UI: other users can't read a listing's address, exact point or the host's phone. They get them only through `get_listing_location` / `reveal_listing_contact`, which check the paywall.

## Run it locally

Needs Node 20.9+ and (for phone sign-in and share links) [cloudflared](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/) — `winget install Cloudflare.cloudflared`.

```bash
npm run setup   # once: installs both apps, creates frontend/.env.local and backend/.env
npm run dev     # backend + frontend + a public tunnel; points your dev bot at the tunnel
```

Open http://localhost:5173. The terminal also prints a **share link** that works on any phone while it runs.
`npm run dev:frontend` / `npm run dev:backend` start one side only. `npm test` runs the backend tests (phone rules, payments), `npm run typecheck` checks both.

> ⚠️ Don't run `npm run build` in `frontend/` while `npm run dev` is running — both use `frontend/.next` and the dev site loses its CSS. If that happens: stop dev, delete `frontend/.next`, start again.

### Settings

| File | Holds | Reaches the browser? |
| --- | --- | --- |
| `frontend/.env.local` | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `API_URL`, `NEXT_PUBLIC_SITE_URL` | only `NEXT_PUBLIC_*` |
| `backend/.env` | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (secret!), `TELEGRAM_*`, `PAYME_*`, `CLICK_*` | never |

Both are git-ignored; the `.env.example` next to each lists every variable. Joining the team? Get the values privately from a teammate and create **your own dev bot** (below).

### First-time setup of the services

1. **Supabase** — new project, region Frankfurt. SQL Editor → run `backend/supabase/schema.sql`. Copy from Project Settings → API Keys: URL, publishable key (frontend), secret key (backend).
2. **Telegram dev bot** — @BotFather → `/newbot` (e.g. `qoshni_dev_bot`). Token and username go in `backend/.env`; `npm run setup` already generated `TELEGRAM_WEBHOOK_SECRET`. `npm run dev` points the bot at your tunnel automatically.

## AI room matcher

The "Find my room with AI" flow on the home page (it also opens by itself on a visitor's first visit). The seeker answers up to five quick questions — city, home region, who's moving in, budget, anything else in their own words — or types one sentence instead. Every question can be skipped.

- **Frontend:** `frontend/src/features/match/` — `MatchFlow.tsx` (the full-screen questions), `MatchPicks.tsx` (the "Picked for you" block above the results), `api.ts`. Styles in `styles/match.css`, texts under `ai.*` in the i18n files.
- **Backend:** `POST /api/match` → `backend/src/match/engine.ts`. Simple rules narrow the catalogue to at most 40 rooms; Claude (`claude-opus-5-5`, low effort, structured output) picks up to 6, scores them and writes a one-line reason per room in the visitor's language. It also turns the free-text note into filters, which the home page then applies.
- **Key:** `CLAUDE_API_KEY` in `backend/.env` locally, and in the Vercel project's environment variables in production (the API runs inside the site there). Without a key, or if a call fails, the same rules rank the rooms and the flow still works, just without the AI wording.
- **Cost and limits:** one Claude call per search, usually 5–10 seconds. 15 searches per 10 minutes per IP.
- **Demo data:** `npm run demo:seed` in `backend/` adds 24 sample rooms across every region; `npm run demo:remove` deletes them.

## The database

Everything is in **`backend/supabase/schema.sql`** — one readable file with a comment on every table (they show in the Supabase dashboard). Helper functions sit in a `private` schema so they don't clutter the API.

| Table | What |
| --- | --- |
| `profiles` | one per account; phone/Telegram written only by the backend |
| `listings` | rooms; only `price` is required. Address/lat/lng are private, `approx_*` is the public fuzzed point |
| `public_listings` (view) | what visitors read — no address, no exact point, no phone |
| `plans`, `orders`, `subscriptions`, `payme_transactions`, `click_transactions` | paid access to contacts |
| `telegram_logins` | 10-minute phone sign-in requests |
| `contact_reveals` | who opened which phone number |
| `app_settings` | one row: `paywall_enabled` |

**Changing the schema:** edit `schema.sql` so it always describes the full current database, and run the same change (an `alter table …`) in the SQL Editor. **Starting over:** run `reset.sql` then `schema.sql` — this deletes all listings, orders and profiles (accounts and photos stay; people re-confirm their phone).

## Code map

```
frontend/src/
  app/            routes (thin): (site)/ public pages, dashboard/, login/, sitemap, robots
  views/          the page components (HomePage, ListingPage, dashboard/ListingFormPage …)
  features/       auth (sign-in, phone check), listings (card, search, title), dashboard, payments
  components/     shared UI: Icon, Select/Chip/Toggle, Header/Footer
  data/           repo.ts (browser ↔ Supabase), server.ts (server reads, cached 30 s), mappers.ts, places.ts
  i18n/           en.ts defines the keys; uz.ts and ru.ts must match (type-checked)
  content/legal.ts  privacy policy + terms (3 languages)
  config.ts       company contacts, plan prices
backend/src/
  index.ts        starts the server · app.ts routes + rate limits (in memory)
  routes/         auth (Telegram sign-in), telegramWebhook, payments
  payments/       Payme and Click protocols (+ tests) · lib/ Supabase admin client, Telegram, phone rules
backend/supabase/ schema.sql, reset.sql
scripts/          dev runner (both apps + tunnel), env setup
```

| I want to… | Go to |
| --- | --- |
| change UI text | `frontend/src/i18n/en.ts`, then the same key in `uz.ts`, `ru.ts` |
| add a city / district / metro station / region | `frontend/src/data/places.ts` (regions also in the `origin` check in `schema.sql`) |
| change what hosts fill in | `frontend/src/views/dashboard/ListingFormPage.tsx` (+ column grants in `schema.sql`) |
| add an API endpoint | `backend/src/routes/`, register in `backend/src/app.ts` |
| change the logo, favicons or link-preview image | replace `frontend/public/logo.svg` / `logo-with-text.svg` (and edit the preview text in the script), then `node scripts/brand-assets.mjs` from `frontend/`; bump the `?v=` in `app/layout.tsx` and `public/site.webmanifest` |
| change Google / link-preview titles and descriptions | `meta.*` keys in the i18n files |
| change prices | `plans` table **and** `PLANS` in `frontend/src/config.ts` |
| turn paid mode on | SQL: `update app_settings set paywall_enabled = true;` |

## Product rules (keep them)

- **The home page has one job:** pick the city you need a room in and the region you're from; rooms with people from your region come first.
- **Posting must stay effortless:** 3 steps, only the price is required. The phone check comes at "Publish", not before.
- Only Uzbek (+998) numbers can sign up — enforced by the site, the API and the database.
- Hosts never pay. Seekers browse free; paid plans unlock contacts only when the paywall is on.

## Deploying

- **One Vercel project serves the site and the API.** Root Directory `frontend`, framework Next.js, region Frankfurt, and keep "Include files outside the root directory" on (the API code is in `backend/`). Variables: the two `NEXT_PUBLIC_SUPABASE_*`, `NEXT_PUBLIC_SITE_URL=https://qushni.uz`, `SUPABASE_SECRET_KEY` (or `SUPABASE_SERVICE_ROLE_KEY`), `TELEGRAM_BOT_TOKEN`, `TELEGRAM_BOT_USERNAME`, `TELEGRAM_WEBHOOK_SECRET` (the **production** bot), and `PAYME_*` / `CLICK_*` once payments start. **No `API_URL`.** Rate limits are counted in memory per serverless instance, so they're looser than on one long-running server.
- **Make `qushni.uz` the primary domain** (Vercel → Domains, `www` redirects to it). Telegram and the payment providers don't follow redirects.
- **Separate backend instead (optional):** any Node host (Railway, Render, Fly.io, a VPS). Root `backend`, build `npm install && npm run build`, start `npm start`, variables from `backend/.env.example`; then set `API_URL` on Vercel to its address.
- **Supabase:** the Security Advisor's warning about the `public_listings` view is expected — that view is how the public sees listings without private fields.
- **Point the production bot at the site** (once, from `backend/`): `TELEGRAM_BOT_TOKEN=… TELEGRAM_WEBHOOK_SECRET=… npm run telegram:webhook -- https://qushni.uz`
- **Check:** `https://qushni.uz/api/health` → `{"ok":true}`; sign in with a phone; post a room with a photo; share a listing link in Telegram (preview shows photo and price).
- **Payments (later):** give Payme `https://qushni.uz/api/payments/payme` (account field `order_id`); give Click `…/api/payments/click/prepare` and `…/complete`. Set `PAYME_*` / `CLICK_*` on Vercel and redeploy, then turn the paywall on.

**Still open:** lawyer-reviewed legal texts (`content/legal.ts`); Uzbek law wants citizens' personal data stored in Uzbekistan — Supabase can be self-hosted there without code changes.
