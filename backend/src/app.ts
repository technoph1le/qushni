import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { rateLimit } from './lib/rateLimit.js';
import { auth } from './routes/auth.js';
import { match } from './routes/match.js';
import { payments } from './routes/payments.js';
import { telegramWebhook } from './routes/telegramWebhook.js';

/** Everything under /api. src/index.ts serves it; the frontend proxies /api/* here. */
export const api = new Hono().basePath('/api');
const TEN_MIN = 10 * 60;

// Login tokens must not end up in hosting logs.
api.use('*', logger((line) => console.log(line.replace(/\/status\/[^\s?]+/, '/status/***'))));

api.use('/auth/telegram/start', rateLimit('start', { windowSeconds: TEN_MIN, max: 10 }));
api.use('/auth/telegram/verify', rateLimit('verify', { windowSeconds: TEN_MIN, max: 20 }));
api.use('/auth/telegram/status/*', rateLimit('status', { windowSeconds: TEN_MIN, max: 400 }));
// Each match runs a Claude call: generous for a person, tight for a script.
api.use('/match', rateLimit('match', { windowSeconds: TEN_MIN, max: 15 }));
api.use('/payments/orders', rateLimit('orders', { windowSeconds: TEN_MIN, max: 20 }));

api.get('/health', (c) => c.json({ ok: true }));
api.route('/auth', auth);
api.route('/telegram/webhook', telegramWebhook);
api.route('/payments', payments);
api.route('/match', match);

api.notFound((c) => c.json({ error: 'not_found' }, 404));
api.onError((err, c) => {
  console.error(err);
  return c.json({ error: 'internal' }, 500);
});
