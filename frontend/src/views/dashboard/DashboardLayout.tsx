'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { Icon, type IconName } from '../../components/Icon';
import { LangSwitch, Logo } from '../../components/ui';
import { useAuth } from '../../features/auth/AuthProvider';
import { useI18n, type TKey } from '../../i18n';
import { cx } from '../../lib/utils';

const NAV: { href: string; icon: IconName; key: TKey; exact?: boolean }[] = [
  { href: '/dashboard', icon: 'grid', key: 'dash.overview', exact: true },
  { href: '/dashboard/listings', icon: 'home', key: 'dash.listings' },
  { href: '/dashboard/new', icon: 'plus', key: 'dash.new' },
  { href: '/dashboard/profile', icon: 'user', key: 'dash.profile' },
];

function NavItem({ item, className, iconSize }: { item: (typeof NAV)[number]; className: string; iconSize: number }) {
  const { t } = useI18n();
  const pathname = usePathname();
  const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
  return (
    <Link href={item.href} className={cx(className, active && 'active')} aria-current={active ? 'page' : undefined}>
      <Icon name={item.icon} size={iconSize} />
      <span>{t(item.key)}</span>
    </Link>
  );
}

/** Shell for every /dashboard page. Signed-out visitors are sent to /login and brought back afterwards. */
export function DashboardLayout({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const { ready, user, signOut } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (ready && !user) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [ready, user, pathname, router]);

  if (!ready || !user) return <div className="page-empty"><span className="spinner" /></div>;

  return (
    <div className="dash">
      <aside className="dash__side">
        <Logo />
        <nav className="dash__nav" aria-label={t('a11y.dashNav')}>
          {NAV.map((n) => (
            <NavItem key={n.href} item={n} className="dash__link" iconSize={18} />
          ))}
        </nav>
        <div className="dash__side-foot">
          <LangSwitch />
          <Link href="/" className="dash__link">
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
        {children}
      </main>

      <nav className="dash__tabs" aria-label={t('a11y.dashNav')}>
        {NAV.map((n) => (
          <NavItem key={n.href} item={n} className="dash__tab" iconSize={20} />
        ))}
      </nav>
    </div>
  );
}
