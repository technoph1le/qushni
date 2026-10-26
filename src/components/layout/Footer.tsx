'use client';

import Link from 'next/link';
import { COMPANY } from '../../config';
import { useI18n } from '../../i18n';
import { actions, useStore } from '../../lib/store';
import { Logo } from '../ui';

export function Footer() {
  const { t } = useI18n();
  const preview = useStore((s) => s.paywallPreview);

  return (
    <footer className="footer">
      <div className="container footer__inner">
        <div>
          <Logo />
          <p className="muted footer__tag">{t('footer.tagline')}</p>
          <p className="muted small">{t('footer.product', { company: COMPANY.name })}</p>
        </div>
        <nav className="footer__col" aria-label={t('footer.legal')}>
          <strong>{t('footer.legal')}</strong>
          <Link href="/terms">{t('legal.terms')}</Link>
          <Link href="/privacy">{t('legal.privacy')}</Link>
        </nav>
        <div className="footer__col">
          <strong>{t('footer.contact')}</strong>
          <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>
          <a href={`https://t.me/${COMPANY.telegram}`} target="_blank" rel="noreferrer">
            Telegram: @{COMPANY.telegram}
          </a>
        </div>
      </div>
      <div className="container footer__bottom">
        <span className="muted small">{t('footer.rights', { year: new Date().getFullYear(), company: COMPANY.name })}</span>
        {process.env.NODE_ENV === 'development' && (
          <button className="link-btn" onClick={() => actions.setPaywallPreview(!preview)}>
            {preview ? t('footer.paywallOff') : t('footer.paywallPreview')}
          </button>
        )}
      </div>
    </footer>
  );
}
