# Deployment

Production setup: **website on Vercel**, **backend on Railway**, **database on Supabase**. The domain used below is `qoshni.uz`; replace it with yours everywhere.

```
https://qoshni.uz        → Vercel   (frontend/)
https://api.qoshni.uz    → Railway  (backend/)
Supabase project         → database, photos, Google sign-in
```

Do the sections in order: each one uses values from the one before.

---

## 0. Before you start

- [ ] **Domain** bought from an accredited `.uz` registrar ([cctld.uz](https://cctld.uz) lists them).
- [ ] **Plans:** Supabase **Pro** (free projects pause after a week of inactivity and have no backups), Railway **Pro** (team workspace), Vercel **Pro** (the free plan is for non-commercial use only).
- [ ] **Contacts on the site:** set the real support email and Telegram handle in [`frontend/src/config.ts`](../frontend/src/config.ts) → `COMPANY`. They appear in the footer, privacy policy and terms. Create that mailbox and Telegram account if they don't exist yet.
- [ ] **Production Telegram bot:** the real bot (e.g. `@qoshni_bot`) is used only in production. Everyone develops with their own dev bot ([SETUP.md](SETUP.md) step 3).
- [ ] **Code on GitHub** in a **private** repository. Check that `git status` never lists a `.env` file.

## 1. Supabase

1. If this is a new project, run every file in [`supabase/migrations/`](../supabase/migrations/) in order (SQL Editor → New query → paste → Run).
2. **Authentication → URL Configuration**
   - **Site URL:** `https://qoshni.uz`
   - **Redirect URLs:** `https://qoshni.uz/**`, `https://www.qoshni.uz/**`. Keep `http://localhost:5173/**` and `https://*.trycloudflare.com/**` for development.
3. **Authentication → Sign In / Providers → Google:** already set up; no change.
4. **Advisors → Security Advisor** will warn that `public_listings` is a "security definer view". This is intentional: that view is how the public sees listings *without* addresses or phone numbers. Ignore this one warning.
5. Delete test data: **Table Editor → listings**, and **Authentication → Users**.

## 2. Backend → Railway

1. [railway.com](https://railway.com) → **New Project → Deploy from GitHub repo** → choose the repository.
2. Service **Settings**:

| Setting | Value |
| --- | --- |
| Root Directory | `backend` |
| Builder | Dockerfile (detected automatically) |
| Region | **EU West (Amsterdam)**, close to Supabase in Frankfurt |
| Healthcheck Path | `/health` |

3. **Variables:** add these. Don't add `PORT`; Railway sets it.

| Variable | Value |
| --- | --- |
| `FRONTEND_URL` | `https://qoshni.uz,https://www.qoshni.uz` |
| `PUBLIC_API_URL` | `https://api.qoshni.uz` |
| `SUPABASE_URL` | from your local `backend/.env` |
| `SUPABASE_SERVICE_ROLE_KEY` | from your local `backend/.env` (the secret key) |
| `TELEGRAM_BOT_TOKEN` | the **production** bot's token |
| `TELEGRAM_BOT_USERNAME` | the production bot's username, without @ |
| `TELEGRAM_WEBHOOK_SECRET` | any long random string; keep a copy for step 5 |
| `PAYME_*`, `CLICK_*` | leave out until payments start (section 6) |

4. **Settings → Networking → Custom Domain:** `api.qoshni.uz`. Add the CNAME record Railway shows at your domain registrar.
5. When `https://api.qoshni.uz/health` shows `{"ok":true}`, point the production bot at it. From the `backend` folder in Git Bash:
   ```bash
   TELEGRAM_BOT_TOKEN=<production token> TELEGRAM_WEBHOOK_SECRET=<same as Railway> PUBLIC_API_URL=https://api.qoshni.uz npm run telegram:webhook
   ```
   Expected output: `Webhook was set`.

Every push to the main branch redeploys automatically. **Deployments** shows logs and has one-click rollback.

## 3. Website → Vercel

1. [vercel.com](https://vercel.com) → **Add New → Project** → import the repository.
2. **Root Directory:** `frontend`. The build settings come from [`frontend/vercel.json`](../frontend/vercel.json).
3. **Environment Variables** (Production):

| Variable | Value |
| --- | --- |
| `VITE_SUPABASE_URL` | from your local `frontend/.env` |
| `VITE_SUPABASE_ANON_KEY` | from your local `frontend/.env` (publishable key) |
| `VITE_API_URL` | `https://api.qoshni.uz` |
| `VITE_SITE_URL` | `https://qoshni.uz` |

4. **Deploy**, then **Settings → Domains**: add `qoshni.uz` and `www.qoshni.uz`, and the DNS records Vercel shows.

If a variable is missing, the live site shows "Configuration error" instead of demo data. Add the variable and **Redeploy**.

## 4. Google Cloud Console

Open your OAuth client:
- **Authorized JavaScript origins:** add `https://qoshni.uz` and `https://www.qoshni.uz`. Keep `http://localhost:5173`.
- **Authorized redirect URIs:** no change.

**Google Auth Platform → Branding:**
- App home page: `https://qoshni.uz`
- Privacy policy: `https://qoshni.uz/privacy`
- Terms of service: `https://qoshni.uz/terms`
- Authorized domains: `qoshni.uz`

**Audience:** make sure the app is **In production**, not *Testing*.

## 5. Test the live site

- [ ] `https://qoshni.uz` loads and shows listings; the browser tab shows the Qo'shni icon.
- [ ] Google sign-in works and returns to the site.
- [ ] Phone sign-in: the code comes from the **production** bot.
- [ ] Post a room with photos, check it on the home page, then delete it.
- [ ] `/privacy` and `/terms` open in all three languages.
- [ ] Open the site on a phone; "Add to Home Screen" shows the Qo'shni icon.
- [ ] Share the link in Telegram: the preview shows the Qo'shni image.
- [ ] Set up an uptime monitor (e.g. UptimeRobot, free) on `https://api.qoshni.uz/health`.

## 6. When payments start

Requires a registered business and a merchant contract.

| | Payme Business | Click |
| --- | --- | --- |
| Endpoint to give them | `https://api.qoshni.uz/payments/payme` | `https://api.qoshni.uz/payments/click/prepare` and `/payments/click/complete` |
| Account field | `order_id` | `merchant_trans_id` = order number |
| Railway variables | `PAYME_MERCHANT_ID`, `PAYME_KEY`, `PAYME_TEST_MODE=true` (then `false` with the live key) | `CLICK_SERVICE_ID`, `CLICK_MERCHANT_ID`, `CLICK_SECRET_KEY` |

Then switch paid mode on in the Supabase SQL Editor:
```sql
update app_settings set paywall_enabled = true;
```

## Still open (planned after funding)

- Lawyer-reviewed privacy policy and terms. The current launch texts live in `frontend/src/content/legal.ts`.
- Personal data storage location: Uzbek law requires citizens' data on servers in Uzbekistan. Supabase can be self-hosted there without code changes.
