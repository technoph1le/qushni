'use client';

import Link from 'next/link';
import { cityName, districtName, regionById } from '../../data/places';
import { useI18n } from '../../i18n';
import { actions, useStore } from '../../lib/store';
import type { Listing } from '../../types';
import { cx } from '../../lib/utils';
import { Icon } from '../../components/Icon';
import { Photo } from '../../components/ui';
import { listingTitle } from './title';

/** Only what decides a click: photo, who lives there, price, where, and for whom. */
export function ListingCard({ listing }: { listing: Listing }) {
  const { t, lt, lang, money } = useI18n();
  const saved = useStore((s) => s.favorites.includes(listing.id));
  const title = listingTitle(listing, lt, t);
  const origin = regionById(listing.origin);

  return (
    <article className="card">
      <div className="card__media">
        <Photo src={listing.photos[0]} alt="" />
        {origin && (
          <span className="card__origin">
            <Icon name="users" size={15} />
            {origin.from[lang]}
          </span>
        )}
      </div>
      <button
        className={cx('card__fav', saved && 'is-active')}
        onClick={() => actions.toggleFavorite(listing.id)}
        aria-label={`${t('card.save')}: ${title}`}
        aria-pressed={saved}
      >
        <Icon name="heart" size={20} fill={saved ? 'currentColor' : 'none'} />
      </button>

      <div className="card__body">
        <p className="price">
          {money(listing.price)} <small>{t('card.perMonth')}</small>
        </p>
        {/* The title link covers the whole card, so one tap anywhere opens it. */}
        <Link href={`/listing/${listing.id}`} className="card__title">
          {title}
        </Link>
        <p className="card__where">
          {districtName(listing.city, listing.district, lang)}, {cityName(listing.city, lang)}
        </p>
        <p className="card__tags">
          <span className={cx('tag', `tag--${listing.gender}`)}>{t(`gender.${listing.gender}`)}</span>
          <span className="tag tag--plain">{t('card.spots', { n: listing.spots })}</span>
        </p>
      </div>
    </article>
  );
}
