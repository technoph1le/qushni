// Registers the bot webhook: npm run telegram:webhook
const token = process.env.TELEGRAM_BOT_TOKEN;
const base = process.env.PUBLIC_API_URL?.replace(/\/$/, '');
const secret = process.env.TELEGRAM_WEBHOOK_SECRET;

if (!token || !base || !secret) {
  console.error('Set TELEGRAM_BOT_TOKEN, PUBLIC_API_URL and TELEGRAM_WEBHOOK_SECRET in .env first.');
  process.exit(1);
}

const res = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ url: `${base}/telegram/webhook`, secret_token: secret, allowed_updates: ['message'] }),
});
console.log(await res.json());
