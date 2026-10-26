import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../features/auth/AuthProvider';
import { useI18n } from '../../i18n';
import { useStore } from '../../lib/store';
import { Icon } from '../Icon';
import { Avatar, LangSwitch, Logo } from '../ui';

export function Header() {
  const { t } = useI18n();
  const { user } = useAuth();
  const favCount = useStore((s) => s.favorites.length);
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const anchor = (id: string) => (pathname === '/' ? `#${id}` : `/#${id}`);
  const displayName = user?.name || user?.phone || '';

  return (
    <header className="header">
      <div className="container header__inner">
        <Logo />
        <nav className="header__nav" aria-label={t('a11y.mainNav')}>
          <a href={anchor('listings')}>{t('nav.listings')}</a>
          <a href={anchor('how')}>{t('nav.how')}</a>
          <a href={anchor('plans')}>{t('nav.plans')}</a>
        </nav>
        <div className="header__actions">
          <LangSwitch />
          <Link to="/saved" className="icon-btn" aria-label={t('nav.saved')} title={t('nav.saved')}>
            <Icon name="heart" />
            {favCount > 0 && <span className="badge">{favCount}</span>}
          </Link>
          {user ? (
            <Link to="/dashboard" className="btn btn--ghost header__desk header__user">
              <Avatar name={displayName || '?'} size={26} />
              <span>{displayName || t('nav.dashboard')}</span>
            </Link>
          ) : (
            <Link to="/login" className="btn btn--ghost header__desk">
              <Icon name="user" size={16} />
              {t('auth.signIn')}
            </Link>
          )}
          <Link to="/dashboard/new" className="btn btn--dark header__desk">
            <Icon name="plus" size={16} />
            {t('nav.post')}
          </Link>
          <button className="icon-btn header__burger" onClick={() => setOpen((o) => !o)} aria-label={t('a11y.menu')} aria-expanded={open} aria-controls="mobile-menu">
            <Icon name={open ? 'x' : 'menu'} />
          </button>
        </div>
      </div>
      {open && (
        <nav id="mobile-menu" className="mobile-menu" aria-label={t('a11y.mainNav')} onClick={() => setOpen(false)}>
          <a href={anchor('listings')}>{t('nav.listings')}</a>
          <a href={anchor('how')}>{t('nav.how')}</a>
          <a href={anchor('plans')}>{t('nav.plans')}</a>
          <Link to="/saved">{t('nav.saved')}</Link>
          {user ? <Link to="/dashboard">{t('nav.dashboard')}</Link> : <Link to="/login">{t('auth.signIn')}</Link>}
          <Link to="/dashboard/new" className="btn btn--dark btn--block">
            <Icon name="plus" size={16} />
            {t('nav.post')}
          </Link>
        </nav>
      )}
    </header>
  );
}
