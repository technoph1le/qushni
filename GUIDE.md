# Qo'shni — developer guide

Find a room and roommates in Uzbekistan, ideally with people from your own region. A **Mir2Dos** product.
UI in Uzbek (default), Russian and English. This one file is the whole manual; it lives outside `frontend/` and `backend/`, so it is never deployed.

## How it fits together

```
Browser ──► frontend/ (Next.js, port 5173)
              ├─ pages, rendered on the server (good for Google and Telegram link previews)
              ├─ /api/*  ──proxy──►  backend/ (Hono on Node, port 8787)
              │                        Telegram sign-in + bot webhook, Payme & Click callbacks
              │                        └──► Supabase with the SECRET key, Telegram Bot API
              └─ Supabase directly with the PUBLIC key: listings, photos, Google sign-in
```

- Because the frontend proxies `/api/*`, the browser, Telegram and the payment providers only ever call `https://<site>/api/...`. Set `API_URL` on the frontend to wherever the backend runs.
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
2. **Google sign-in** — Google Cloud → Google Auth Platform → Web client. JS origin `http://localhost:5173`, redirect URI `https://<project>.supabase.co/auth/v1/callback`. Paste client ID/secret into Supabase → Authentication → Providers → Google. Supabase → Authentication → URL Configuration: Site URL `http://localhost:5173`; redirect URLs `http://localhost:5173/**` and `https://*.trycloudflare.com/**`.
3. **Telegram dev bot** — @BotFather → `/newbot` (e.g. `qoshni_dev_bot`). Token and username go in `backend/.env`; `npm run setup` already generated `TELEGRAM_WEBHOOK_SECRET`. `npm run dev` points the bot at your tunnel automatically.

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
| change prices | `plans` table **and** `PLANS` in `frontend/src/config.ts` |
| turn paid mode on | SQL: `update app_settings set paywall_enabled = true;` |

## Product rules (keep them)

- **The home page has one job:** pick the city you need a room in and the region you're from; rooms with people from your region come first.
- **Posting must stay effortless:** 3 steps, only the price is required. The phone check comes at "Publish", not before.
- Only Uzbek (+998) numbers can sign up — enforced by the site, the API and the database.
- Hosts never pay. Seekers browse free; paid plans unlock contacts only when the paywall is on.

## Deploying

- **Frontend → Vercel.** Root Directory `frontend`, framework Next.js, region Frankfurt. Variables: the two `NEXT_PUBLIC_SUPABASE_*`, `NEXT_PUBLIC_SITE_URL=https://qoshni.uz`, and `API_URL` = the backend's address.
- **Backend → any Node host** that keeps a process running (Railway, Render, Fly.io, a VPS), region near Frankfurt. Root `backend`, build `npm install && npm run build`, start `npm start`. Variables: everything in `backend/.env.example`, with the **production** bot. Rate limits are counted in memory, so run one instance.
- **Supabase:** Authentication → URL Configuration → add `https://qoshni.uz/**`. Google Cloud: add `https://qoshni.uz` as a JS origin; Branding → privacy `/privacy`, terms `/terms`; Audience → In production. The Security Advisor's warning about the `public_listings` view is expected — that view is how the public sees listings without private fields.
- **Point the production bot at the site** (once, from `backend/`): `TELEGRAM_BOT_TOKEN=… TELEGRAM_WEBHOOK_SECRET=… npm run telegram:webhook -- https://qoshni.uz`
- **Check:** `https://qoshni.uz/api/health` → `{"ok":true}`; sign in with Google and with a phone; post a room with a photo; share a listing link in Telegram (preview shows photo and price).
- **Payments (later):** give Payme `https://qoshni.uz/api/payments/payme` (account field `order_id`); give Click `…/api/payments/click/prepare` and `…/complete`. Set `PAYME_*` / `CLICK_*` on the backend, then turn the paywall on.

**Still open:** lawyer-reviewed legal texts (`content/legal.ts`); Uzbek law wants citizens' personal data stored in Uzbekistan — Supabase can be self-hosted there without code changes.
