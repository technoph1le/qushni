'use client';

import { useEffect, type ReactNode } from 'react';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { AuthProvider } from '../features/auth/AuthProvider';
import { I18nProvider, useI18n } from '../i18n';
import { hydrateStore } from '../lib/store';
import { CONFIG_MISSING } from '../lib/supabase';
import type { Lang } from '../types';

function SkipLink() {
  const { t } = useI18n();
  return (
    <a className="skip-link" href="#main">
      {t('a11y.skip')}
    </a>
  );
}

/** Everything that needs the browser: language, sign-in state, saved favourites. */
export function Providers({ lang, children }: { lang: Lang; children: ReactNode }) {
  useEffect(() => {
    hydrateStore();
  }, []);

  if (CONFIG_MISSING) {
    return (
      <div className="page-empty">
        <h1>Qo&apos;shni</h1>
        <p className="muted">
          Configuration error: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY are missing. Set them
          (Vercel → Settings → Environment Variables, or .env.local) and redeploy.
        </p>
      </div>
    );
  }

  return (
    <I18nProvider initialLang={lang}>
      <SkipLink />
      <ErrorBoundary>
        <AuthProvider>{children}</AuthProvider>
      </ErrorBoundary>
    </I18nProvider>
  );
}
