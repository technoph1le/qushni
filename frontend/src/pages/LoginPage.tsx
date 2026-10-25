import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthProvider';
import { Icon } from '../components/Icon';
import { PhoneVerify } from '../features/auth/PhoneVerify';
import { LangSwitch, Logo } from '../components/ui';
import { useI18n } from '../i18n';

/** Only same-site paths, so `?next=` can't redirect to another domain. */
export function safeNext(raw: string | null) {
  return raw && raw.startsWith('/') && !raw.startsWith('//') ? raw : '/dashboard';
}

/** Supabase reports a failed Google sign-in as ?error_description=… or #error_description=… */
function oauthError() {
  const read = (s: string) => new URLSearchParams(s).get('error_description');
  const msg = read(window.location.search) ?? read(window.location.hash.slice(1));
  if (msg) console.error('Google sign-in failed:', msg);
  return msg ?? '';
}

export function LoginPage() {
  const { t, tx } = useI18n();
  const { user, ready, signInWithGoogle } = useAuth();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const next = safeNext(params.get('next'));
  const [error, setError] = useState(() => oauthError());

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  if (ready && user) return <Navigate to={next} replace />;

  return (
    <main id="main" className="auth-page">
      <div className="auth-page__top">
        <Logo />
        <LangSwitch />
      </div>
      <div className="auth-card">
        <h1>{t('auth.title')}</h1>
        <p className="muted">{t('auth.lead')}</p>

        <button
          className="btn btn--outline btn--block btn--lg"
          onClick={() => signInWithGoogle(next).catch(() => setError(t('auth.err.generic')))}
        >
          <GoogleMark />
          {t('auth.google')}
        </button>

        <div className="divider"><span>{t('auth.or')}</span></div>

        <PhoneVerify onDone={() => navigate(next, { replace: true })} />
        {error && <p className="form__error" role="alert"><Icon name="info" size={16} />{error}</p>}
        <p className="auth-card__legal">
          {tx('auth.agree', {
            terms: <Link to="/terms">{t('auth.agreeTerms')}</Link>,
            privacy: <Link to="/privacy">{t('auth.agreePrivacy')}</Link>,
          })}
        </p>
      </div>
    </main>
  );
}

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}
