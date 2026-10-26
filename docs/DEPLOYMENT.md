# Deployment

Qo'shni is one Next.js app on **Vercel**: the website and its API (`/api/…` for Telegram sign-in and payments) deploy together. **Supabase** holds the database, photos and Google sign-in. There is no separate backend server.

The domain used below is `qoshni.uz`; replace it with yours everywhere.

---

## 0. Before you start

- [ ] **Plans:** Vercel **Pro** (the free Hobby plan is for non-commercial use only), Supabase **Pro** (free projects pause after a week of inactivity and have no backups).
- [ ] **Domain** bought from an accredited `.uz` registrar ([cctld.uz](https://cctld.uz) lists them).
- [ ] **Contacts on the site:** set the real support email and Telegram handle in [`src/config.ts`](../src/config.ts) → `COMPANY`. They appear in the footer, privacy policy and terms.
- [ ] **Production Telegram bot:** the real bot (e.g. `@qoshni_bot`) is used only on Vercel. Everyone develops with their own dev bot ([SETUP.md](SETUP.md) step 3).
- [ ] **Code on GitHub** in a **private** repository. `.env.local` is git-ignored; check that `git status` never lists it.

## 1. Supabase

1. Run every file in [`supabase/migrations/`](../supabase/migrations/) that isn't applied yet, in order (SQL Editor → New query → paste → Run). **The newest one, `20261026000000_rate_limits.sql`, is new with the Next.js version — run it now.**
2. **Authentication → URL Configuration**
   - **Site URL:** `https://qoshni.uz`
   - **Redirect URLs:** `https://qoshni.uz/**`, `https://www.qoshni.uz/**`. Keep `http://localhost:5173/**` and `https://*.trycloudflare.com/**` for development.
3. **Advisors → Security Advisor** will warn that `public_listings` is a "security definer view". This is intentional: that view is how the public sees listings *without* addresses or phone numbers.
4. Before launch, delete test data: **Table Editor → listings**, and **Authentication → Users**.

## 2. Vercel

### Project settings (once)

Vercel → your project → **Settings**:

| Setting | Value |
| --- | --- |
| Build & Deployment → **Framework Preset** | **Next.js** |
| Build & Deployment → **Root Directory** | **empty** (the repository root). If it still says `frontend`, clear it. |
| Build & Deployment → Node.js Version | 20.x or newer |
| Functions → **Function Region** | **Frankfurt (fra1)**, next to Supabase |

### Environment variables

**Settings → Environment Variables.** The **Supabase integration** (Integrations → Supabase → connect the **same** project) already adds `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` / `SUPABASE_SECRET_KEY`. Add the rest:

| Variable | Value | Notes |
| --- | --- | --- |
| `TELEGRAM_BOT_TOKEN` | production bot token | mark **Sensitive** |
| `TELEGRAM_BOT_USERNAME` | production bot username, without @ | |
| `TELEGRAM_WEBHOOK_SECRET` | a long random string (e.g. a password generator, letters and digits only) | mark **Sensitive**; keep a copy for step 4 |
| `NEXT_PUBLIC_SITE_URL` | `https://qoshni.uz` | optional; without it Vercel's domain is used for link previews |
| `PAYME_*`, `CLICK_*` | — | only when payments start (section 5) |

Leftover `VITE_*` variables from the earlier version can be deleted.

Variables take effect on the next deploy: **Deployments → ⋯ → Redeploy**.

### Domain

**Settings → Domains** → add `qoshni.uz` and `www.qoshni.uz`, then add the DNS records Vercel shows at your registrar.

## 3. Google Cloud Console

Open your OAuth client:
- **Authorized JavaScript origins:** add `https://qoshni.uz` and `https://www.qoshni.uz`. Keep `http://localhost:5173`.
- **Authorized redirect URIs:** no change (it points to Supabase).

**Google Auth Platform → Branding:** home page `https://qoshni.uz`, privacy policy `https://qoshni.uz/privacy`, terms of service `https://qoshni.uz/terms`, authorized domain `qoshni.uz`.

**Audience:** the app must be **In production**, not *Testing*.

## 4. Point the production bot at the site

After the first deploy with the Telegram variables, run this from your computer in the project folder (Git Bash):

```bash
TELEGRAM_BOT_TOKEN=<production token> TELEGRAM_WEBHOOK_SECRET=<same as on Vercel> npm run telegram:webhook -- https://qoshni.uz
```

Expected: `Webhook was set`. The bot now sends messages to `https://qoshni.uz/api/telegram/webhook`.

## 5. Test the live site

- [ ] `https://qoshni.uz` shows listings; the browser tab shows the Qo'shni icon.
- [ ] `https://qoshni.uz/api/health` shows `{"ok":true}`.
- [ ] Google sign-in works and returns to the site.
- [ ] Phone sign-in: the code comes from the **production** bot.
- [ ] Post a room with photos, check it on the home page, then delete it.
- [ ] Share a listing link in Telegram: the preview shows that room's photo, title and price.
- [ ] `/privacy` and `/terms` open; `/sitemap.xml` lists the rooms.
- [ ] Set up a free uptime monitor (e.g. UptimeRobot) on `https://qoshni.uz/api/health`.

Every push to the main branch redeploys automatically; **Deployments** has logs and one-click rollback. API errors appear under **Logs**.

## 6. When payments start

Requires a registered business and a merchant contract.

| | Payme Business | Click |
| --- | --- | --- |
| Endpoint to give them | `https://qoshni.uz/api/payments/payme` | `https://qoshni.uz/api/payments/click/prepare` and `/api/payments/click/complete` |
| Account field | `order_id` | `merchant_trans_id` = order number |
| Vercel variables | `PAYME_MERCHANT_ID`, `PAYME_KEY`, `PAYME_TEST_MODE=true` (then `false` with the live key) | `CLICK_SERVICE_ID`, `CLICK_MERCHANT_ID`, `CLICK_SECRET_KEY` |

Redeploy, then switch paid mode on in the Supabase SQL Editor:
```sql
update app_settings set paywall_enabled = true;
```

## Still open (planned after funding)

- Lawyer-reviewed privacy policy and terms; the launch texts live in `src/content/legal.ts`.
- Personal data storage location: Uzbek law requires citizens' data on servers in Uzbekistan. Supabase can be self-hosted there without code changes.
