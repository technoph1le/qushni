import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { PLANS, type Plan } from '../../config';
import { useI18n } from '../../i18n';
import { apiFetch, DEMO } from '../../lib/supabase';
import { setState } from '../../lib/store';
import { cx } from '../../lib/utils';
import { Icon } from '../../components/Icon';
import { useDialog } from '../../components/useDialog';

export function planLabel(plan: Plan, t: ReturnType<typeof useI18n>['t']) {
  return plan.days === 30 ? t('plans.month') : t('plans.days', { n: plan.days });
}

export function PlanOptions({ onPick, compact }: { onPick?: (p: Plan) => void; compact?: boolean }) {
  const { t, money } = useI18n();
  const { access } = useAuth();

  return (
    <div className={cx('plan-options', compact && 'plan-options--compact')}>
      {PLANS.map((p) => (
        <div key={p.id} className={cx('plan', p.popular && 'plan--popular')}>
          {p.popular && <span className="plan__badge">{t('plans.popular')}</span>}
          <span className="plan__name">{planLabel(p, t)}</span>
          <span className="plan__price">{money(p.price)}</span>
          {!compact && (
            <ul className="checklist">
              <li><Icon name="check" size={16} />{t('plans.f.contacts')}</li>
              <li><Icon name="check" size={16} />{t('plans.f.location')}</li>
              <li><Icon name="check" size={16} />{t('plans.f.browse')}</li>
            </ul>
          )}
          {access.paywallOn && onPick ? (
            <button className={cx('btn btn--block', p.popular ? 'btn--lime' : 'btn--outline')} onClick={() => onPick(p)}>
              {t('plans.buy')}
            </button>
          ) : (
            <span className="plan__soon">{t('plans.soon')}</span>
          )}
        </div>
      ))}
    </div>
  );
}

type Provider = 'payme' | 'click';

export function PayModal({ plan, onClose }: { plan: Plan; onClose: () => void }) {
  const { t, money, lang } = useI18n();
  const { user, refreshAccess } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [provider, setProvider] = useState<Provider>('payme');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const boxRef = useDialog<HTMLDivElement>(onClose);

  const pay = async () => {
    if (!user) {
      navigate(`/login?next=${encodeURIComponent(location.pathname + location.search)}`);
      return;
    }
    setError('');
    setBusy(true);
    if (DEMO) {
      setState({ demoAccessUntil: new Date(Date.now() + plan.days * 86400000).toISOString() });
      await refreshAccess();
      setDone(true);
      setBusy(false);
      return;
    }
    try {
      const res = await apiFetch<{ url: string }>('/payments/orders', { body: { plan_id: plan.id, provider, lang } });
      window.location.href = res.url;
    } catch {
      setError(t('pay.error'));
      setBusy(false);
    }
  };

  return (
    <div className="modal" onClick={onClose}>
      <div ref={boxRef} className="modal__box" role="dialog" aria-modal="true" aria-labelledby="pay-title" onClick={(e) => e.stopPropagation()}>
        <button className="icon-btn modal__x" onClick={onClose} aria-label={t('pay.close')}>
          <Icon name="x" />
        </button>
        {done ? (
          <div className="modal__done">
            <span className="modal__check"><Icon name="check" size={28} /></span>
            <h3 id="pay-title">{t('pay.done')}</h3>
            <button className="btn btn--dark btn--block" onClick={onClose}>{t('common.close')}</button>
          </div>
        ) : (
          <>
            <h3 id="pay-title">{t('pay.title')}</h3>
            <p className="muted small">{DEMO ? t('pay.lead') : t('pay.leadReal')}</p>
            <div className="pay-summary">
              <span>{planLabel(plan, t)}</span>
              <strong>{money(plan.price)}</strong>
            </div>
            <span className="field__label">{t('pay.method')}</span>
            <div className="pay-methods pay-methods--2">
              {(['payme', 'click'] as Provider[]).map((m) => (
                <button key={m} className={cx('pay-method', provider === m && 'is-active')} onClick={() => setProvider(m)}>
                  {m === 'payme' ? 'Payme' : 'Click'}
                </button>
              ))}
            </div>
            {error && <p className="form__error" role="alert"><Icon name="info" size={16} />{error}</p>}
            <button className="btn btn--lime btn--block btn--lg" onClick={pay} disabled={busy}>
              {!user ? t('pay.loginFirst') : busy ? t('pay.redirecting') : t('pay.confirm', { v: money(plan.price) })}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
