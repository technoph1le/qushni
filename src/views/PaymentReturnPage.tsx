'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '../features/auth/AuthProvider';
import { Icon } from '../components/Icon';
import { useI18n } from '../i18n';
import { supabase } from '../lib/supabase';

type Status = 'pending' | 'paid' | 'failed';

const POLL_MS = 3000;
const MAX_POLLS = 40;

/** Payme/Click send the user back here; the order is confirmed server-to-server, so we poll its status. */
export function PaymentReturnPage() {
  const { t, date } = useI18n();
  const { refreshAccess, access } = useAuth();
  const params = useSearchParams();
  const orderId = Number(params.get('order'));
  const [status, setStatus] = useState<Status>('pending');

  useEffect(() => {
    if (!supabase || !orderId) {
      setStatus('failed');
      return;
    }
    let polls = 0;
    let stop = false;
    const tick = async () => {
      const { data } = await supabase!.from('orders').select('status').eq('id', orderId).maybeSingle();
      if (stop) return;
      if (data?.status === 'paid') {
        setStatus('paid');
        refreshAccess();
        return;
      }
      if (data?.status === 'cancelled' || data?.status === 'refunded' || ++polls >= MAX_POLLS) {
        setStatus(data?.status === 'pending' ? 'pending' : 'failed');
        return;
      }
      setTimeout(tick, POLL_MS);
    };
    tick();
    return () => {
      stop = true;
    };
  }, [orderId, refreshAccess]);

  return (
    <div className="container page-empty">
      <span className={`result-icon result-icon--${status}`}>
        {status === 'pending' ? <span className="spinner" /> : <Icon name={status === 'paid' ? 'check' : 'x'} size={28} />}
      </span>
      <h1>{t(`payret.${status}.t`)}</h1>
      <p className="muted">
        {status === 'paid'
          ? t('payret.paid.d', { d: access.accessUntil ? date(access.accessUntil.slice(0, 10)) : '…' })
          : t(`payret.${status}.d`)}
      </p>
      <Link href="/#listings" className="btn btn--dark">{t('payret.cta')}</Link>
    </div>
  );
}
