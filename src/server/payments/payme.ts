// Payme Merchant API (JSON-RPC). Payme calls this endpoint; we never call Payme.
// Docs: https://developer.help.paycom.uz/metody-merchant-api/
import type { PaymentRepo, PaymeTx } from './repo';

const TIMEOUT_MS = 12 * 60 * 60 * 1000;

const STATE = { created: 1, performed: 2, cancelled: -1, cancelledAfterPerform: -2 } as const;

type Msg = { ru: string; uz: string; en: string };

const ERR = {
  auth: { code: -32504, message: { ru: 'Недостаточно привилегий', uz: 'Ruxsat yetarli emas', en: 'Insufficient privileges' } },
  method: { code: -32601, message: { ru: 'Метод не найден', uz: 'Metod topilmadi', en: 'Method not found' } },
  parse: { code: -32700, message: { ru: 'Ошибка разбора JSON', uz: 'JSON xato', en: 'Parse error' } },
  amount: { code: -31001, message: { ru: 'Неверная сумма', uz: "Noto'g'ri summa", en: 'Incorrect amount' } },
  txNotFound: { code: -31003, message: { ru: 'Транзакция не найдена', uz: 'Tranzaksiya topilmadi', en: 'Transaction not found' } },
  cannotPerform: { code: -31008, message: { ru: 'Невозможно выполнить операцию', uz: "Amalni bajarib bo'lmaydi", en: 'Unable to perform operation' } },
  orderNotFound: { code: -31050, message: { ru: 'Заказ не найден', uz: 'Buyurtma topilmadi', en: 'Order not found' }, data: 'order_id' },
  orderNotPayable: { code: -31051, message: { ru: 'Заказ уже оплачен или отменён', uz: "Buyurtma to'langan yoki bekor qilingan", en: 'Order already paid or cancelled' }, data: 'order_id' },
  orderBusy: { code: -31099, message: { ru: 'Заказ ожидает оплаты', uz: "Buyurtma to'lov kutmoqda", en: 'Order is awaiting payment' }, data: 'order_id' },
  internal: { code: -32400, message: { ru: 'Системная ошибка', uz: 'Tizim xatosi', en: 'Internal error' } },
} satisfies Record<string, { code: number; message: Msg; data?: string }>;

class RpcError extends Error {
  constructor(public readonly payload: { code: number; message: Msg; data?: string }) {
    super(payload.message.en);
  }
}

export interface RpcRequest {
  id?: number | string | null;
  method?: string;
  params?: Record<string, any>;
}

export function checkPaymeAuth(header: string | undefined, key: string): boolean {
  if (!header?.startsWith('Basic ')) return false;
  const decoded = Buffer.from(header.slice(6), 'base64').toString('utf8');
  const sep = decoded.indexOf(':');
  return sep > 0 && decoded.slice(0, sep) === 'Paycom' && decoded.slice(sep + 1) === key;
}

export async function handlePayme(
  req: RpcRequest,
  authorized: boolean,
  repo: PaymentRepo,
  now: () => number = Date.now,
): Promise<Record<string, unknown>> {
  const id = req?.id ?? null;
  try {
    if (!authorized) throw new RpcError(ERR.auth);
    if (!req || typeof req.method !== 'string') throw new RpcError(ERR.parse);
    const p = req.params ?? {};
    const result = await dispatch(req.method, p, repo, now);
    return { jsonrpc: '2.0', id, result };
  } catch (e) {
    if (e instanceof RpcError) return { jsonrpc: '2.0', id, error: e.payload };
    console.error('payme error', e);
    return { jsonrpc: '2.0', id, error: ERR.internal };
  }
}

async function validateOrder(repo: PaymentRepo, account: any, amount: number) {
  const order = await repo.getOrder(Number(account?.order_id));
  if (!order || order.provider !== 'payme') throw new RpcError(ERR.orderNotFound);
  if (order.status !== 'pending') throw new RpcError(ERR.orderNotPayable);
  if (Number(amount) !== order.amount * 100) throw new RpcError(ERR.amount);
  return order;
}

const txView = (tx: PaymeTx) => ({ transaction: String(tx.internal_id), state: tx.state });

async function expire(repo: PaymentRepo, tx: PaymeTx, now: number) {
  await repo.payme.update(tx.id, { state: STATE.cancelled, reason: 4, cancel_time: now });
  await repo.cancelOrder(tx.order_id, false);
}

async function dispatch(method: string, p: Record<string, any>, repo: PaymentRepo, now: () => number) {
  switch (method) {
    case 'CheckPerformTransaction': {
      await validateOrder(repo, p.account, p.amount);
      return { allow: true };
    }

    case 'CreateTransaction': {
      const existing = await repo.payme.get(String(p.id));
      if (existing) {
        if (existing.state !== STATE.created) throw new RpcError(ERR.cannotPerform);
        if (now() - existing.create_time > TIMEOUT_MS) {
          await expire(repo, existing, now());
          throw new RpcError(ERR.cannotPerform);
        }
        return { create_time: existing.create_time, ...txView(existing) };
      }
      const order = await validateOrder(repo, p.account, p.amount);
      const active = await repo.payme.activeForOrder(order.id);
      if (active) throw new RpcError(ERR.orderBusy);
      const tx = await repo.payme.insert({
        id: String(p.id),
        order_id: order.id,
        amount: Number(p.amount),
        state: STATE.created,
        reason: null,
        payme_time: Number(p.time),
        create_time: now(),
        perform_time: 0,
        cancel_time: 0,
      });
      return { create_time: tx.create_time, ...txView(tx) };
    }

    case 'PerformTransaction': {
      const tx = await repo.payme.get(String(p.id));
      if (!tx) throw new RpcError(ERR.txNotFound);
      if (tx.state === STATE.performed) return { perform_time: tx.perform_time, ...txView(tx) };
      if (tx.state !== STATE.created) throw new RpcError(ERR.cannotPerform);
      if (now() - tx.create_time > TIMEOUT_MS) {
        await expire(repo, tx, now());
        throw new RpcError(ERR.cannotPerform);
      }
      await repo.completeOrder(tx.order_id);
      const perform_time = now();
      await repo.payme.update(tx.id, { state: STATE.performed, perform_time });
      return { perform_time, ...txView({ ...tx, state: STATE.performed }) };
    }

    case 'CancelTransaction': {
      const tx = await repo.payme.get(String(p.id));
      if (!tx) throw new RpcError(ERR.txNotFound);
      if (tx.state === STATE.cancelled || tx.state === STATE.cancelledAfterPerform) {
        return { cancel_time: tx.cancel_time, ...txView(tx) };
      }
      const refund = tx.state === STATE.performed;
      const state = refund ? STATE.cancelledAfterPerform : STATE.cancelled;
      const cancel_time = now();
      await repo.payme.update(tx.id, { state, reason: Number(p.reason) || null, cancel_time });
      await repo.cancelOrder(tx.order_id, refund);
      return { cancel_time, ...txView({ ...tx, state }) };
    }

    case 'CheckTransaction': {
      const tx = await repo.payme.get(String(p.id));
      if (!tx) throw new RpcError(ERR.txNotFound);
      return {
        create_time: tx.create_time,
        perform_time: tx.perform_time,
        cancel_time: tx.cancel_time,
        reason: tx.reason,
        ...txView(tx),
      };
    }

    case 'GetStatement': {
      const list = await repo.payme.between(Number(p.from), Number(p.to));
      return {
        transactions: list.map((tx) => ({
          id: tx.id,
          time: tx.payme_time,
          amount: tx.amount,
          account: { order_id: String(tx.order_id) },
          create_time: tx.create_time,
          perform_time: tx.perform_time,
          cancel_time: tx.cancel_time,
          reason: tx.reason,
          ...txView(tx),
        })),
      };
    }

    default:
      throw new RpcError(ERR.method);
  }
}

export function paymeCheckoutUrl(opts: {
  merchantId: string;
  orderId: number;
  amountSum: number;
  returnUrl: string;
  lang: string;
  test: boolean;
}) {
  const params = `m=${opts.merchantId};ac.order_id=${opts.orderId};a=${opts.amountSum * 100};c=${opts.returnUrl};l=${opts.lang}`;
  const host = opts.test ? 'https://checkout.test.paycom.uz' : 'https://checkout.paycom.uz';
  return `${host}/${Buffer.from(params).toString('base64')}`;
}
