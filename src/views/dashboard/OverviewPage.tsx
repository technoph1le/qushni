'use client';

import Link from 'next/link';
import { Icon, type IconName } from '../../components/Icon';
import { useAuth } from '../../features/auth/AuthProvider';
import { MyListingsTable, PhoneBanner, useMyListings } from '../../features/dashboard/MyListings';
import { useI18n } from '../../i18n';

export function OverviewPage() {
  const { t, num } = useI18n();
  const { user } = useAuth();
  const { list, reload } = useMyListings();
  const mine = list ?? [];

  const stats: { icon: IconName; label: string; value: number }[] = [
    { icon: 'home', label: t('dash.stat.active'), value: mine.filter((l) => l.status === 'active').length },
    { icon: 'eye', label: t('dash.stat.views'), value: mine.reduce((s, l) => s + l.views, 0) },
    { icon: 'phone', label: t('dash.stat.contacts'), value: mine.reduce((s, l) => s + l.contacts, 0) },
  ];

  return (
    <>
      <div className="dash__head">
        <div>
          <h1>{t('dash.hello', { name: user?.name || user?.phone || '' })}</h1>
          <p className="muted">{t('dash.helloLead')}</p>
        </div>
        <Link href="/dashboard/new" className="btn btn--dark">
          <Icon name="plus" size={16} />
          {t('dash.new')}
        </Link>
      </div>

      <PhoneBanner />

      <div className="stats stats--3">
        {stats.map((s) => (
          <div key={s.label} className="stat">
            <span className="stat__icon"><Icon name={s.icon} size={18} /></span>
            <span className="muted small">{s.label}</span>
            <strong>{num(s.value)}</strong>
          </div>
        ))}
      </div>

      <MyListingsTable list={list} reload={reload} />

      <div className="tip">
        <Icon name="bolt" size={18} />
        <div>
          <strong>{t('dash.tip.t')}</strong>
          <p>{t('dash.tip.d')}</p>
        </div>
      </div>
    </>
  );
}
