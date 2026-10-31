'use client';

import { useEffect, useRef, useState } from 'react';
import { useAuth, type PhoneStart } from './AuthProvider';
import { useI18n, type TKey } from '../../i18n';
import { ApiError } from '../../lib/supabase';
import { formatPhone } from '../../lib/utils';
import { Icon } from '../../components/Icon';

type Step = { kind: 'phone' } | { kind: 'bot'; start: PhoneStart } | { kind: 'code'; start: PhoneStart };

const RESEND_SECONDS = 60;

function errorText(t: ReturnType<typeof useI18n>['t'], err: unknown) {
  if (err instanceof ApiError) {
    const key = `auth.err.${err.code}` as TKey;
    if (err.code === 'invalid_code') return t(key, { n: Number(err.data.attempts_left ?? 0) });
    if (['invalid_phone', 'too_many_requests', 'phone_taken', 'expired', 'too_many_attempts', 'network'].includes(err.code)) return t(key);
  }
  return t('auth.err.generic');
}

/** Phone number → code in Telegram → signed in (or phone linked to the current account). */
export function PhoneVerify({ onDone }: { onDone: (result: 'signed_in' | 'linked') => void }) {
  const { t, lang } = useI18n();
  const { startPhone, phoneStatus, verifyCode } = useAuth();
  const [step, setStep] = useState<Step>({ kind: 'phone' });
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const codeRef = useRef<HTMLInputElement>(null);

  const fullPhone = `+998${phone.replace(/\D/g, '')}`;

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  // While the user is in the bot, poll until the code has been sent.
  useEffect(() => {
    if (step.kind !== 'bot') return;
    const id = setInterval(async () => {
      try {
        const status = await phoneStatus(step.start.token);
        if (status === 'code_sent') setStep({ kind: 'code', start: step.start });
        if (status === 'expired') {
          setError(t('auth.err.expired'));
          setStep({ kind: 'phone' });
        }
      } catch {
        /* keep polling */
      }
    }, 2000);
    return () => clearInterval(id);
  }, [step, phoneStatus, t]);

  useEffect(() => {
    if (step.kind === 'code') codeRef.current?.focus();
  }, [step.kind]);

  const requestCode = async () => {
    setError('');
    setBusy(true);
    try {
      const start = await startPhone(fullPhone, lang);
      setCooldown(RESEND_SECONDS);
      setCode('');
      setStep(start.mode === 'code_sent' ? { kind: 'code', start } : { kind: 'bot', start });
    } catch (err) {
      setError(errorText(t, err));
    } finally {
      setBusy(false);
    }
  };

  const submitCode = async () => {
    if (step.kind !== 'code' || code.length !== 6) return;
    setError('');
    setBusy(true);
    try {
      onDone(await verifyCode(step.start.token, code));
    } catch (err) {
      setError(errorText(t, err));
      if (err instanceof ApiError && ['expired', 'too_many_attempts'].includes(err.code)) setStep({ kind: 'phone' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="phone-verify">
      {step.kind === 'phone' && (
        <form
          className="form-stack"
          onSubmit={(e) => {
            e.preventDefault();
            requestCode();
          }}
        >
          <label className="input">
            <span>{t('auth.phone')}</span>
            <span className="phone-input">
              <span className="phone-input__prefix">+998</span>
              <input
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                placeholder="90 123 45 67"
                value={phone}
                onChange={(e) => {
                  let d = e.target.value.replace(/\D/g, '');
                  if (d.length > 9 && d.startsWith('998')) d = d.slice(3);
                  setPhone(d.slice(0, 9));
                }}
                required
              />
            </span>
          </label>
          <button type="submit" className="btn btn--telegram btn--block btn--lg" disabled={busy || phone.replace(/\D/g, '').length !== 9}>
            <Icon name="send" size={18} />
            {t('auth.getCode')}
          </button>
          <p className="muted small">{t('auth.why')}</p>
        </form>
      )}

      {step.kind === 'bot' && (
        <div className="form-stack">
          <strong className="phone-verify__title">{t('auth.openBot.t')}</strong>
          <p className="muted">{t('auth.openBot.d')}</p>
          <a className="btn btn--telegram btn--block btn--lg" href={step.start.link} target="_blank" rel="noreferrer">
            <Icon name="send" size={18} />
            {t('auth.openBot.cta')}
          </a>
          <p className="phone-verify__wait" role="status"><span className="spinner" aria-hidden="true" />{t('auth.waiting')}</p>
          <button type="button" className="link-btn" onClick={() => setStep({ kind: 'phone' })}>{t('auth.changePhone')}</button>
        </div>
      )}

      {step.kind === 'code' && (
        <form
          className="form-stack"
          onSubmit={(e) => {
            e.preventDefault();
            submitCode();
          }}
        >
          <strong className="phone-verify__title">{t('auth.code.t')}</strong>
          <p className="muted">{t('auth.code.d', { phone: formatPhone(fullPhone) })}</p>
          <input
            ref={codeRef}
            className="code-input"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder="••••••"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          />
          <button type="submit" className="btn btn--dark btn--block btn--lg" disabled={busy || code.length !== 6}>
            {t('auth.verify')}
          </button>
          <div className="phone-verify__links">
            <button type="button" className="link-btn" onClick={() => setStep({ kind: 'phone' })}>{t('auth.changePhone')}</button>
            <button type="button" className="link-btn" onClick={requestCode} disabled={cooldown > 0 || busy}>
              {cooldown > 0 ? t('auth.resendIn', { n: cooldown }) : t('auth.resend')}
            </button>
          </div>
        </form>
      )}

      {error && <p className="form__error" role="alert"><Icon name="info" size={16} />{error}</p>}
    </div>
  );
}
