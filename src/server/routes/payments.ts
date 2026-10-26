import { Hono } from 'hono';
import { clickEnabled, env, paymeEnabled } from '../env.js';
import { clickCheckoutUrl, handleClick } from '../payments/click.js';
import { checkPaymeAuth, handlePayme, paymeCheckoutUrl } from '../payments/payme.js';
import { supabaseRepo } from '../payments/repo.js';
import { db, userFromRequest } from '../lib/supabase.js';

export const payments = new Hono();

payments.get('/providers', (c) => c.json({ payme: paymeEnabled(), click: clickEnabled() }));

// The signed-in user picks a plan and a provider; we create a pending order and return the checkout URL.
payments.post('/orders', async (c) => {
  const user = await userFromRequest(c);
  if (!user) return c.json({ error: 'unauthorized' }, 401);

  const body = await c.req.json().catch(() => ({}));
  const provider = body.provider === 'click' ? 'click' : body.provider === 'payme' ? 'payme' : null;
  if (!provider) return c.json({ error: 'invalid_provider' }, 400);
  if ((provider === 'payme' && !paymeEnabled()) || (provider === 'click' && !clickEnabled())) {
    return c.json({ error: 'provider_disabled' }, 503);
  }

  const { data: plan } = await db.from('plans').select('id, price').eq('id', String(body.plan_id)).eq('active', true).maybeSingle();
  if (!plan) return c.json({ error: 'invalid_plan' }, 400);

  const { data: order, error } = await db
    .from('orders')
    .insert({ user_id: user.id, plan_id: plan.id, amount: plan.price, provider })
    .select('id, amount')
    .single();
  if (error || !order) return c.json({ error: 'order_failed' }, 500);

  const returnUrl = `${env.frontendUrl}/payment/return?order=${order.id}`;
  const lang = ['uz', 'ru', 'en'].includes(body.lang) ? body.lang : 'uz';

  const url =
    provider === 'payme'
      ? paymeCheckoutUrl({
          merchantId: env.payme.merchantId,
          orderId: order.id,
          amountSum: order.amount,
          returnUrl,
          lang,
          test: env.payme.testMode,
        })
      : clickCheckoutUrl({
          serviceId: env.click.serviceId,
          merchantId: env.click.merchantId,
          orderId: order.id,
          amountSum: order.amount,
          returnUrl,
        });

  return c.json({ order_id: order.id, url });
});

// Payme → us (JSON-RPC, Basic auth "Paycom:<key>"). Payme expects HTTP 200 even for errors.
payments.post('/payme', async (c) => {
  if (!paymeEnabled()) return c.body(null, 404);
  const authorized = checkPaymeAuth(c.req.header('authorization'), env.payme.key);
  const req = await c.req.json().catch(() => null);
  return c.json(await handlePayme(req ?? {}, authorized, supabaseRepo));
});

// Click → us (form-encoded).
for (const stage of ['prepare', 'complete'] as const) {
  payments.post(`/click/${stage}`, async (c) => {
    if (!clickEnabled()) return c.body(null, 404);
    const raw = await c.req.parseBody();
    const params = Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, String(v)]));
    return c.json(await handleClick(stage, params, env.click, supabaseRepo));
  });
}
