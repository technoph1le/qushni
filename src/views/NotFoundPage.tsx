'use client';

import Link from 'next/link';
import { useI18n } from '../i18n';

export function NotFoundPage() {
  const { t } = useI18n();
  return (
    <div className="container page-empty">
      <h1>{t('notFound.title')}</h1>
      <Link href="/" className="btn btn--dark">{t('notFound.cta')}</Link>
    </div>
  );
}
