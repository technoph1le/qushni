import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { secureHeaders } from 'hono/secure-headers';
import { env } from './env.js';
import { rateLimit } from './lib/rateLimit.js';
import { auth } from './routes/auth.js';
import { payments } from './routes/payments.js';
import { telegramWebhook } from './routes/telegramWebhook.js';

const app = new Hono();
const TEN_MIN = 10 * 60 * 1000;

// Login tokens must not end up in hosting logs.
app.use('*', logger((line) => console.log(line.replace(/\/status\/[^\s?]+/, '/status/***'))));
app.use('*', secureHeaders());

const browserCors = cors({ origin: env.frontendUrls, allowHeaders: ['content-type', 'authorization'] });
app.use('/auth/*', browserCors);
app.use('/payments/orders', browserCors);
app.use('/payments/providers', browserCors);

app.use('/auth/telegram/start', rateLimit({ windowMs: TEN_MIN, max: 10 }));
app.use('/auth/telegram/verify', rateLimit({ windowMs: TEN_MIN, max: 20 }));
app.use('/auth/telegram/status/*', rateLimit({ windowMs: TEN_MIN, max: 400 }));
app.use('/payments/orders', rateLimit({ windowMs: TEN_MIN, max: 20 }));

app.get('/health', (c) => c.json({ ok: true }));
app.route('/auth', auth);
app.route('/telegram/webhook', telegramWebhook);
app.route('/payments', payments);

app.notFound((c) => c.json({ error: 'not_found' }, 404));
app.onError((err, c) => {
  console.error(err);
  return c.json({ error: 'internal' }, 500);
});

serve({ fetch: app.fetch, port: env.port }, (info) => {
  console.log(`Qo'shni API listening on port ${info.port}`);
});
