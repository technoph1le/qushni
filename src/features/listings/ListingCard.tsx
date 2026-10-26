'use client';

import Link from 'next/link';
import { cityName, districtName } from '../../data/places';
import { useI18n } from '../../i18n';
import { actions, useStore } from '../../lib/store';
import type { Listing } from '../../types';
import { cx } from '../../lib/utils';
import { Icon } from '../../components/Icon';
import { Avatar, Photo } from '../../components/ui';

export function ListingCard({ listing }: { listing: Listing }) {
  const { t, lt, lang, money, date } = useI18n();
  const saved = useStore((s) => s.favorites.includes(listing.id));
  const title = lt(listing.title);
  const keyAmenities = (['bus', 'wifi', 'washer', 'ac', 'furniture'] as const).filter((a) => listing.amenities.includes(a)).slice(0, 4);

  return (
    <article className="card">
      <Link href={`/listing/${listing.id}`} className="card__media">
        <Photo src={listing.photos[0]} alt={title} />
        <span className="card__city">{cityName(listing.city, lang)}</span>
        <span className="card__spots">{t('card.spots', { n: listing.spots })}</span>
      </Link>
      <button
        className={cx('card__fav', saved && 'is-active')}
        onClick={() => actions.toggleFavorite(listing.id)}
        aria-label={t('card.save')}
        aria-pressed={saved}
      >
        <Icon name="heart" size={18} fill={saved ? 'currentColor' : 'none'} />
      </button>

      <div className="card__body">
        <div className="card__eyebrow">
          <span>
            {districtName(listing.city, listing.district, lang)} · {t(`room.${listing.roomType}`)}
          </span>
          <span className={cx('tag', `tag--${listing.gender}`)}>{t(`gender.${listing.gender}`)}</span>
        </div>
        <Link href={`/listing/${listing.id}`} className="card__title">
          {title}
        </Link>

        <div className="card__meta">
          <span>
            <Icon name="metro" size={15} />
            {listing.metro ? t('card.minMetro', { n: listing.metro.minutes, s: listing.metro.station }) : t('card.noMetro')}
          </span>
          <span>
            <Icon name="calendar" size={15} />
            {t('card.from', { d: date(listing.availableFrom) })}
          </span>
        </div>

        {listing.housemates.length > 0 && (
          <div className="card__mates">
            <span className="avatars">
              {listing.housemates.slice(0, 3).map((m) => (
                <Avatar key={m.name} name={m.name} size={26} />
              ))}
            </span>
            <span className="card__mates-text">
              <strong>{listing.housemates.map((m) => `${m.name}, ${m.age}`).join(' · ')}</strong>
              <small>{t('card.living')}</small>
            </span>
            {listing.host.verified && (
              <span className="verified" title={t('card.verified')}>
                <Icon name="shield" size={15} />
                {t('card.verified')}
              </span>
            )}
          </div>
        )}

        <div className="card__tags">
          {keyAmenities.map((a) => (
            <span key={a} className="pill">
              {t(`am.${a}`)}
            </span>
          ))}
          {listing.utilitiesIncluded && <span className="pill">{t('card.utilities')}</span>}
          {listing.centre && <span className="pill">{t('card.centre')}</span>}
        </div>

        <div className="card__foot">
          <div>
            <div className="price">{money(listing.price)}</div>
            <small className="muted">{t('card.perMonth')}</small>
          </div>
          <Link href={`/listing/${listing.id}`} className="btn btn--outline btn--sm" aria-label={title}>
            <Icon name="arrowRight" size={16} />
          </Link>
        </div>
      </div>
    </article>
  );
}
