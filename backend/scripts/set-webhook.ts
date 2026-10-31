// Points a Telegram bot at a deployed site: npm run telegram:webhook -- https://qoshni.uz
// Uses TELEGRAM_BOT_TOKEN and TELEGRAM_WEBHOOK_SECRET from .env.local (or the environment, which wins).
// Locally you don't need this: `npm run dev` points your dev bot at the tunnel automatically.
export {};

const token = process.env.TELEGRAM_BOT_TOKEN;
const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
const base = (process.argv[2] || process.env.NEXT_PUBLIC_SITE_URL || '').replace(/\/$/, '');

if (!token || !secret || !base.startsWith('https://')) {
  console.error('Usage: npm run telegram:webhook -- https://your-domain');
  console.error('TELEGRAM_BOT_TOKEN and TELEGRAM_WEBHOOK_SECRET must be set (in .env.local or the environment).');
  process.exit(1);
}

const res = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ url: `${base}/api/telegram/webhook`, secret_token: secret, allowed_updates: ['message'] }),
});
console.log(await res.json());
