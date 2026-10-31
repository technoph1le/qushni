'use client';

import { Component, type ReactNode } from 'react';
import { useI18n } from '../i18n';

function Fallback() {
  const { t } = useI18n();
  return (
    <div className="page-empty">
      <h1>{t('auth.err.generic')}</h1>
      <a className="btn btn--dark" href="/">{t('notFound.cta')}</a>
    </div>
  );
}

export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.error(error);
  }

  render() {
    return this.state.failed ? <Fallback /> : this.props.children;
  }
}
