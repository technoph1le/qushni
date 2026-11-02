'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../features/auth/AuthProvider';
import { PhoneVerify } from '../features/auth/PhoneVerify';
import { LangSwitch, Logo } from '../components/ui';
import { useI18n } from '../i18n';

/** Only same-site paths, so `?next=` can't redirect to another domain. */
export function safeNext(raw: string | null) {
  return raw && raw.startsWith('/') && !raw.startsWith('//') ? raw : '/dashboard';
}

export function LoginPage() {
  const { t, tx } = useI18n();
  const { user, ready } = useAuth();
  const params = useSearchParams();
  const router = useRouter();
  const next = safeNext(params.get('next'));

  useEffect(() => {
    if (ready && user) router.replace(next);
  }, [ready, user, next, router]);

  return (
    <main id="main" className="auth-page">
      <div className="auth-page__top">
        <Logo />
        <LangSwitch />
      </div>
      <div className="auth-card">
        <h1>{t('auth.title')}</h1>
        <p className="muted">{t('auth.lead')}</p>

        <PhoneVerify onDone={() => router.replace(next)} />
        <p className="auth-card__legal">
          {tx('auth.agree', {
            terms: <Link href="/terms">{t('auth.agreeTerms')}</Link>,
            privacy: <Link href="/privacy">{t('auth.agreePrivacy')}</Link>,
          })}
        </p>
      </div>
    </main>
  );
}
