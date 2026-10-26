import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import { clickSign, handleClick } from './click.js';
import { checkPaymeAuth, handlePayme } from './payme.js';
import type { ClickTx, Order, PaymentRepo, PaymeTx } from './repo.js';

function memoryRepo() {
  const orders = new Map<number, Order>();
  const subs: { order_id: number; revoked: boolean }[] = [];
  const payme = new Map<string, PaymeTx>();
  const click = new Map<number, ClickTx>();
  let seq = 1;
  const repo: PaymentRepo = {
    async getOrder(id) { return orders.get(id) ?? null; },
    async completeOrder(id) {
      const o = orders.get(id)!;
      if (o.status === 'paid') return;
      if (o.status !== 'pending') throw new Error('order_not_payable');
      o.status = 'paid';
      subs.push({ order_id: id, revoked: false });
    },
    async cancelOrder(id, refund) {
      const o = orders.get(id)!;
      if (refund && o.status === 'paid') {
        o.status = 'refunded';
        subs.filter((s) => s.order_id === id).forEach((s) => (s.revoked = true));
      } else if (!refund && o.status === 'pending') o.status = 'cancelled';
    },
    payme: {
      async get(id) { return payme.get(id) ?? null; },
      async activeForOrder(orderId) { return [...payme.values()].find((t) => t.order_id === orderId && t.state === 1) ?? null; },
      async insert(tx) { const full = { ...tx, internal_id: seq++ }; payme.set(tx.id, full); return full; },
      async update(id, patch) { Object.assign(payme.get(id)!, patch); },
      async between(from, to) { return [...payme.values()].filter((t) => t.payme_time >= from && t.payme_time <= to); },
    },
    click: {
      async get(id) { return click.get(id) ?? null; },
      async upsert(tx) { click.set(tx.click_trans_id, { ...tx }); },
      async setStatus(id, status) { click.get(id)!.status = status; },
    },
  };
  return { repo, orders, subs, payme };
}

const order = (id: number, provider: 'payme' | 'click', amount = 79000): Order => ({
  id, user_id: 'u1', plan_id: '30d', amount, provider, status: 'pending',
});

describe('Payme', () => {
  let m: ReturnType<typeof memoryRepo>;
  let clock = 1_000_000;
  const now = () => clock;
  const call = (method: string, params: Record<string, unknown>, authorized = true) =>
    handlePayme({ id: 1, method, params }, authorized, m.repo, now) as Promise<any>;

  beforeEach(() => {
    m = memoryRepo();
    m.orders.set(10, order(10, 'payme'));
    clock = 1_000_000;
  });

  it('checks Basic auth', () => {
    const h = 'Basic ' + Buffer.from('Paycom:secret').toString('base64');
    assert.equal(checkPaymeAuth(h, 'secret'), true);
    assert.equal(checkPaymeAuth(h, 'other'), false);
    assert.equal(checkPaymeAuth(undefined, 'secret'), false);
  });

  it('rejects unauthorized calls with -32504', async () => {
    const r = await call('CheckPerformTransaction', {}, false);
    assert.equal(r.error.code, -32504);
  });

  it('validates order and amount', async () => {
    assert.equal((await call('CheckPerformTransaction', { amount: 7900000, account: { order_id: '10' } })).result.allow, true);
    assert.equal((await call('CheckPerformTransaction', { amount: 100, account: { order_id: '10' } })).error.code, -31001);
    assert.equal((await call('CheckPerformTransaction', { amount: 7900000, account: { order_id: '99' } })).error.code, -31050);
  });

  it('runs create → perform → cancel (refund) and is idempotent', async () => {
    const create = await call('CreateTransaction', { id: 'p1', time: 5, amount: 7900000, account: { order_id: '10' } });
    assert.equal(create.result.state, 1);
    const again = await call('CreateTransaction', { id: 'p1', time: 5, amount: 7900000, account: { order_id: '10' } });
    assert.deepEqual(again.result, create.result);

    const busy = await call('CreateTransaction', { id: 'p2', time: 6, amount: 7900000, account: { order_id: '10' } });
    assert.equal(busy.error.code, -31099);

    const perform = await call('PerformTransaction', { id: 'p1' });
    assert.equal(perform.result.state, 2);
    assert.equal(m.orders.get(10)!.status, 'paid');
    assert.equal(m.subs.length, 1);
    assert.deepEqual((await call('PerformTransaction', { id: 'p1' })).result, perform.result);

    const cancel = await call('CancelTransaction', { id: 'p1', reason: 5 });
    assert.equal(cancel.result.state, -2);
    assert.equal(m.orders.get(10)!.status, 'refunded');
    assert.equal(m.subs[0].revoked, true);

    const check = await call('CheckTransaction', { id: 'p1' });
    assert.equal(check.result.state, -2);
    assert.equal(check.result.reason, 5);
  });

  it('expires transactions older than 12 hours', async () => {
    await call('CreateTransaction', { id: 'p1', time: 5, amount: 7900000, account: { order_id: '10' } });
    clock += 12 * 60 * 60 * 1000 + 1;
    const r = await call('PerformTransaction', { id: 'p1' });
    assert.equal(r.error.code, -31008);
    assert.equal(m.payme.get('p1')!.state, -1);
    assert.equal(m.payme.get('p1')!.reason, 4);
  });

  it('cancels an unperformed transaction', async () => {
    await call('CreateTransaction', { id: 'p1', time: 5, amount: 7900000, account: { order_id: '10' } });
    const r = await call('CancelTransaction', { id: 'p1', reason: 3 });
    assert.equal(r.result.state, -1);
    assert.equal(m.orders.get(10)!.status, 'cancelled');
    assert.equal((await call('PerformTransaction', { id: 'p1' })).error.code, -31008);
  });

  it('returns -31003 for unknown transactions and -32601 for unknown methods', async () => {
    assert.equal((await call('PerformTransaction', { id: 'nope' })).error.code, -31003);
    assert.equal((await call('Foo', {})).error.code, -32601);
  });

  it('lists transactions in GetStatement', async () => {
    await call('CreateTransaction', { id: 'p1', time: 50, amount: 7900000, account: { order_id: '10' } });
    const r = await call('GetStatement', { from: 0, to: 100 });
    assert.equal(r.result.transactions.length, 1);
    assert.equal(r.result.transactions[0].account.order_id, '10');
  });
});

describe('Click', () => {
  const cfg = { serviceId: '111', secretKey: 'sec' };
  let m: ReturnType<typeof memoryRepo>;

  const params = (action: '0' | '1', extra: Record<string, string> = {}) => {
    const p: Record<string, string> = {
      click_trans_id: '555', service_id: '111', click_paydoc_id: '1', merchant_trans_id: '20',
      amount: '79000', action, error: '0', error_note: 'Success', sign_time: '2026-10-22 10:00:00', ...extra,
    };
    if (action === '1' && !p.merchant_prepare_id) p.merchant_prepare_id = '20';
    p.sign_string = clickSign(p, cfg.secretKey, action === '1');
    return p;
  };

  beforeEach(() => {
    m = memoryRepo();
    m.orders.set(20, order(20, 'click'));
  });

  it('prepares and completes a payment', async () => {
    const prep = await handleClick('prepare', params('0'), cfg, m.repo);
    assert.equal(prep.error, 0);
    assert.equal(prep.merchant_prepare_id, 20);
    const done = await handleClick('complete', params('1'), cfg, m.repo);
    assert.equal(done.error, 0);
    assert.equal(m.orders.get(20)!.status, 'paid');
    const repeat = await handleClick('complete', params('1'), cfg, m.repo);
    assert.equal(repeat.error, -4);
  });

  it('rejects a bad signature', async () => {
    const p = params('0');
    p.sign_string = 'x';
    assert.equal((await handleClick('prepare', p, cfg, m.repo)).error, -1);
  });

  it('rejects a wrong amount and unknown order', async () => {
    assert.equal((await handleClick('prepare', params('0', { amount: '100' }), cfg, m.repo)).error, -2);
    assert.equal((await handleClick('prepare', params('0', { merchant_trans_id: '99' }), cfg, m.repo)).error, -5);
  });

  it('cancels when Click reports an error on complete', async () => {
    await handleClick('prepare', params('0'), cfg, m.repo);
    const r = await handleClick('complete', params('1', { error: '-5017' }), cfg, m.repo);
    assert.equal(r.error, -9);
    assert.equal(m.orders.get(20)!.status, 'cancelled');
  });

  it('requires prepare before complete', async () => {
    assert.equal((await handleClick('complete', params('1'), cfg, m.repo)).error, -6);
  });
});
