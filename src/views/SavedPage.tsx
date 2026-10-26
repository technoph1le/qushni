'use client';

import Link from 'next/link';
import { Icon } from '../components/Icon';
import { useListings } from '../data/useListings';
import { ListingCard } from '../features/listings/ListingCard';
import { useI18n } from '../i18n';
import { useStore } from '../lib/store';

export function SavedPage() {
  const { t } = useI18n();
  const { listings, loading } = useListings();
  const favorites = useStore((s) => s.favorites);
  const saved = listings.filter((l) => favorites.includes(l.id));

  return (
    <section className="section">
      <div className="container">
        <h1 className="section__title section__title--page">{t('nav.saved')}</h1>
        {loading ? (
          <div className="empty"><span className="spinner" />{t('common.loading')}</div>
        ) : saved.length === 0 ? (
          <div className="empty">
            <Icon name="heart" size={28} />
            <strong>{t('saved.empty')}</strong>
            <span className="muted">{t('saved.emptyHint')}</span>
            <Link href="/#listings" className="btn btn--dark">{t('nav.listings')}</Link>
          </div>
        ) : (
          <div className="grid grid--3">
            {saved.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
