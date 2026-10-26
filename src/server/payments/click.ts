// Click SHOP API: Click calls Prepare (action=0) then Complete (action=1).
// Docs: https://docs.click.uz/click-api-request/
import { createHash } from 'node:crypto';
import type { PaymentRepo } from './repo';

const md5 = (s: string) => createHash('md5').update(s).digest('hex');

export const CLICK_ERR = {
  ok: [0, 'Success'],
  sign: [-1, 'SIGN CHECK FAILED!'],
  amount: [-2, 'Incorrect parameter amount'],
  action: [-3, 'Action not found'],
  alreadyPaid: [-4, 'Already paid'],
  orderNotFound: [-5, 'User does not exist'],
  txNotFound: [-6, 'Transaction does not exist'],
  badRequest: [-8, 'Error in request from click'],
  cancelled: [-9, 'Transaction cancelled'],
} as const;

type Params = Record<string, string>;

export function clickSign(p: Params, secret: string, withPrepareId: boolean) {
  return md5(
    p.click_trans_id +
      p.service_id +
      secret +
      p.merchant_trans_id +
      (withPrepareId ? p.merchant_prepare_id : '') +
      p.amount +
      p.action +
      p.sign_time,
  );
}

const REQUIRED = ['click_trans_id', 'service_id', 'merchant_trans_id', 'amount', 'action', 'sign_time', 'sign_string'];

export async function handleClick(
  stage: 'prepare' | 'complete',
  p: Params,
  cfg: { serviceId: string; secretKey: string },
  repo: PaymentRepo,
) {
  const reply = (err: readonly [number, string], extra: Record<string, unknown> = {}) => ({
    click_trans_id: p.click_trans_id ? Number(p.click_trans_id) : null,
    merchant_trans_id: p.merchant_trans_id ?? null,
    ...extra,
    error: err[0],
    error_note: err[1],
  });

  if (REQUIRED.some((k) => p[k] === undefined) || (stage === 'complete' && p.merchant_prepare_id === undefined)) {
    return reply(CLICK_ERR.badRequest);
  }
  if (p.service_id !== cfg.serviceId || clickSign(p, cfg.secretKey, stage === 'complete') !== p.sign_string) {
    return reply(CLICK_ERR.sign);
  }
  if (p.action !== (stage === 'prepare' ? '0' : '1')) return reply(CLICK_ERR.action);

  const order = await repo.getOrder(Number(p.merchant_trans_id));
  if (!order || order.provider !== 'click') return reply(CLICK_ERR.orderNotFound);
  if (order.status === 'paid') return reply(CLICK_ERR.alreadyPaid);
  if (order.status !== 'pending') return reply(CLICK_ERR.cancelled);
  if (Math.abs(Number(p.amount) - order.amount) > 0.01) return reply(CLICK_ERR.amount);

  const clickTransId = Number(p.click_trans_id);

  if (stage === 'prepare') {
    await repo.click.upsert({ click_trans_id: clickTransId, order_id: order.id, amount: Number(p.amount), status: 'prepared' });
    return reply(CLICK_ERR.ok, { merchant_prepare_id: order.id });
  }

  const tx = await repo.click.get(clickTransId);
  if (!tx || tx.order_id !== order.id || String(order.id) !== p.merchant_prepare_id) return reply(CLICK_ERR.txNotFound);
  if (tx.status === 'cancelled') return reply(CLICK_ERR.cancelled);

  // Click reports a failed payment on its side with a negative `error`.
  if (Number(p.error) < 0) {
    await repo.click.setStatus(clickTransId, 'cancelled');
    await repo.cancelOrder(order.id, false);
    return reply(CLICK_ERR.cancelled);
  }

  await repo.completeOrder(order.id);
  await repo.click.setStatus(clickTransId, 'completed');
  return reply(CLICK_ERR.ok, { merchant_confirm_id: order.id });
}

export function clickCheckoutUrl(opts: { serviceId: string; merchantId: string; orderId: number; amountSum: number; returnUrl: string }) {
  const q = new URLSearchParams({
    service_id: opts.serviceId,
    merchant_id: opts.merchantId,
    amount: String(opts.amountSum),
    transaction_param: String(opts.orderId),
    return_url: opts.returnUrl,
  });
  return `https://my.click.uz/services/pay?${q}`;
}
