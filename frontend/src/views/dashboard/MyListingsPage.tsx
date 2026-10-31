'use client';

import Link from 'next/link';
import { Icon } from '../../components/Icon';
import { MyListingsTable, PhoneBanner, useMyListings } from '../../features/dashboard/MyListings';
import { useI18n } from '../../i18n';

export function MyListingsPage() {
  const { t } = useI18n();
  const { list, reload } = useMyListings();
  return (
    <>
      <div className="dash__head">
        <h1>{t('dash.listings')}</h1>
        <Link href="/dashboard/new" className="btn btn--dark">
          <Icon name="plus" size={16} />
          {t('dash.new')}
        </Link>
      </div>
      <PhoneBanner />
      <MyListingsTable list={list} reload={reload} />
    </>
  );
}
