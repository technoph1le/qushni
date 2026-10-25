import { db } from '../lib/supabase.js';

export interface Order {
  id: number;
  user_id: string;
  plan_id: string;
  amount: number; // so'm
  provider: 'payme' | 'click';
  status: 'pending' | 'paid' | 'cancelled' | 'refunded';
}

export interface PaymeTx {
  id: string;
  internal_id: number;
  order_id: number;
  amount: number; // tiyin
  state: number;
  reason: number | null;
  payme_time: number;
  create_time: number;
  perform_time: number;
  cancel_time: number;
}

export interface ClickTx {
  click_trans_id: number;
  order_id: number;
  amount: number;
  status: 'prepared' | 'completed' | 'cancelled';
}

export interface PaymentRepo {
  getOrder(id: number): Promise<Order | null>;
  completeOrder(id: number): Promise<void>;
  cancelOrder(id: number, refund: boolean): Promise<void>;
  payme: {
    get(id: string): Promise<PaymeTx | null>;
    activeForOrder(orderId: number): Promise<PaymeTx | null>;
    insert(tx: Omit<PaymeTx, 'internal_id'>): Promise<PaymeTx>;
    update(id: string, patch: Partial<PaymeTx>): Promise<void>;
    between(from: number, to: number): Promise<PaymeTx[]>;
  };
  click: {
    get(id: number): Promise<ClickTx | null>;
    upsert(tx: ClickTx): Promise<void>;
    setStatus(id: number, status: ClickTx['status']): Promise<void>;
  };
}

function check<T>(res: { data: T; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data;
}

export const supabaseRepo: PaymentRepo = {
  async getOrder(id) {
    if (!Number.isSafeInteger(id)) return null;
    return check(await db.from('orders').select('*').eq('id', id).maybeSingle()) as Order | null;
  },
  async completeOrder(id) {
    check(await db.rpc('complete_order', { p_order: id }));
  },
  async cancelOrder(id, refund) {
    check(await db.rpc('cancel_order', { p_order: id, p_refund: refund }));
  },
  payme: {
    async get(id) {
      return check(await db.from('payme_transactions').select('*').eq('id', id).maybeSingle()) as PaymeTx | null;
    },
    async activeForOrder(orderId) {
      return check(
        await db.from('payme_transactions').select('*').eq('order_id', orderId).eq('state', 1).limit(1).maybeSingle(),
      ) as PaymeTx | null;
    },
    async insert(tx) {
      return check(await db.from('payme_transactions').insert(tx).select().single()) as PaymeTx;
    },
    async update(id, patch) {
      check(await db.from('payme_transactions').update(patch).eq('id', id));
    },
    async between(from, to) {
      return check(
        await db.from('payme_transactions').select('*').gte('payme_time', from).lte('payme_time', to).order('payme_time'),
      ) as PaymeTx[];
    },
  },
  click: {
    async get(id) {
      return check(await db.from('click_transactions').select('*').eq('click_trans_id', id).maybeSingle()) as ClickTx | null;
    },
    async upsert(tx) {
      check(await db.from('click_transactions').upsert(tx));
    },
    async setStatus(id, status) {
      check(await db.from('click_transactions').update({ status }).eq('click_trans_id', id));
    },
  },
};
