import { Link, Navigate, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../features/auth/AuthProvider';
import { Icon, type IconName } from '../../components/Icon';
import { LangSwitch, Logo } from '../../components/ui';
import { useI18n, type TKey } from '../../i18n';
import { DEMO } from '../../lib/supabase';

const NAV: { to: string; icon: IconName; key: TKey; end?: boolean }[] = [
  { to: '/dashboard', icon: 'grid', key: 'dash.overview', end: true },
  { to: '/dashboard/listings', icon: 'home', key: 'dash.listings' },
  { to: '/dashboard/new', icon: 'plus', key: 'dash.new' },
  { to: '/dashboard/profile', icon: 'user', key: 'dash.profile' },
];

export function DashboardLayout() {
  const { t } = useI18n();
  const { ready, user, signOut } = useAuth();
  const location = useLocation();

  if (!ready) return <div className="page-empty"><span className="spinner" /></div>;
  if (!user) return <Navigate to={`/login?next=${encodeURIComponent(location.pathname)}`} replace />;

  return (
    <div className="dash">
      <aside className="dash__side">
        <Logo />
        <nav className="dash__nav" aria-label={t('a11y.dashNav')}>
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end} className="dash__link">
              <Icon name={n.icon} size={18} />
              <span>{t(n.key)}</span>
            </NavLink>
          ))}
        </nav>
        <div className="dash__side-foot">
          <LangSwitch />
          <Link to="/" className="dash__link">
            <Icon name="chevronLeft" size={18} />
            <span>{t('dash.toSite')}</span>
          </Link>
          <button className="dash__link" onClick={() => signOut()}>
            <Icon name="logout" size={18} />
            <span>{t('auth.signOut')}</span>
          </button>
        </div>
      </aside>

      <div className="dash__mobile-top">
        <Logo />
        <LangSwitch />
      </div>

      <main id="main" className="dash__main" tabIndex={-1}>
        <Outlet />
        {DEMO && <p className="dash__note"><Icon name="info" size={14} />{t('dash.demoNote')}</p>}
      </main>

      <nav className="dash__tabs" aria-label={t('a11y.dashNav')}>
        {NAV.map((n) => (
          <NavLink key={n.to} to={n.to} end={n.end} className="dash__tab">
            <Icon name={n.icon} size={20} />
            <span>{t(n.key)}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
