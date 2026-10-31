'use client';

import type { ReactNode } from 'react';
import { useAuth } from '../../features/auth/AuthProvider';
import { useI18n } from '../../i18n';
import { useStore } from '../../lib/store';
import { Footer } from './Footer';
import { Header } from './Header';

/** Header, main area and footer used by every public page. */
export function SiteShell({ children }: { children: ReactNode }) {
  const { access } = useAuth();
  const preview = useStore((s) => s.paywallPreview);
  const { t } = useI18n();
  return (
    <>
      {access.paywallOn && preview && <div className="preview-bar">{t('footer.paywallPreview')}</div>}
      <Header />
      <main id="main" tabIndex={-1}>
        {children}
      </main>
      <Footer />
    </>
  );
}
