'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../features/auth/AuthProvider';
import { Icon, type IconName } from '../components/Icon';
import { PayModal, PlanOptions } from '../features/payments/Plans';
import { Avatar, Photo } from '../components/ui';
import type { Plan } from '../config';
import { cityName, districtName } from '../data/places';
import { repo, SubscriptionRequired } from '../data/repo';
import { useListings } from '../data/useListings';
import { useI18n } from '../i18n';
import { actions, useStore } from '../lib/store';
import type { Amenity, Listing, ListingContact, ListingLocation } from '../types';
import { cx, formatPhone, maskPhone, osmEmbed } from '../lib/utils';

const AMENITY_ICON: Partial<Record<Amenity, IconName>> = {
  metro: 'metro',
  bus: 'bus',
  wifi: 'wifi',
  heating: 'bolt',
  furniture: 'bed',
  kitchen: 'home',
  parking: 'pin',
  elevator: 'layers',
  security: 'shield',
};

export function ListingPage({ id, initialListing }: { id: string; initialListing: Listing | null }) {
  const { t, lt, lang, money, date, num } = useI18n();
  const { access } = useAuth();
  const { listings, loading } = useListings();
  const cached = listings.find((l) => l.id === id);
  const [fetched, setFetched] = useState<Listing | null | undefined>(undefined);
  const listing = cached ?? fetched ?? initialListing;
  const saved = useStore((s) => s.favorites.includes(id));
  const [photo, setPhoto] = useState(0);
  const [location, setLocation] = useState<ListingLocation | null>(null);
  const [contact, setContact] = useState<ListingContact | null>(null);
  const [locked, setLocked] = useState(false);
  const [buying, setBuying] = useState<Plan | null>(null);

  useEffect(() => {
    repo.bumpView(id).catch(() => {});
    setPhoto(0);
    setContact(null);
    setFetched(undefined);
  }, [id]);

  // Not in the public catalogue (e.g. the owner's paused listing) — ask directly.
  useEffect(() => {
    if (!loading && !cached && !initialListing && fetched === undefined) {
      repo.getListing(id).then(setFetched).catch(() => setFetched(null));
    }
  }, [loading, cached, initialListing, fetched, id]);

  useEffect(() => {
    setLocation(null);
    setLocked(!access.has);
    if (!access.has) return;
    repo.getLocation(id).then(setLocation).catch(() => setLocation(null));
  }, [id, access.has]);

  if (!listing) {
    if (loading || fetched === undefined) {
      return <div className="container page-empty"><span className="spinner" /></div>;
    }
    return (
      <div className="container page-empty">
        <h1>{t('detail.notFound')}</h1>
        <Link href="/" className="btn btn--dark">{t('detail.back')}</Link>
      </div>
    );
  }

  const title = lt(listing.title);
  const area = `${districtName(listing.city, listing.district, lang)}, ${cityName(listing.city, lang)}`;
  const showLocked = locked || !access.has;

  const reveal = async () => {
    try {
      setContact(await repo.revealContact(listing.id));
    } catch (err) {
      if (err instanceof SubscriptionRequired) setLocked(true);
    }
  };

  const facts: { icon: IconName; label: string; value: string }[] = [
    { icon: 'bed', label: t('detail.rooms'), value: String(listing.rooms) },
    { icon: 'ruler', label: t('detail.area'), value: t('detail.m2', { n: listing.area }) },
    { icon: 'layers', label: t('detail.floor'), value: t('detail.floorOf', { a: listing.floor, b: listing.floors }) },
    { icon: 'calendar', label: t('detail.available'), value: date(listing.availableFrom) },
    { icon: 'wallet', label: t('detail.deposit'), value: listing.deposit ? money(listing.deposit) : t('detail.noDeposit') },
    { icon: 'bolt', label: t('detail.utilities'), value: listing.utilitiesIncluded ? t('detail.utilitiesIn') : t('detail.utilitiesOut') },
  ];

  return (
    <div className="container detail">
      <Link href="/#listings" className="back-link">
        <Icon name="chevronLeft" size={16} />
        {t('detail.back')}
      </Link>

      <div className="gallery">
        <div className="gallery__main">
          <Photo src={listing.photos[photo]} alt={title} />
          {listing.photos.length > 1 && (
            <>
              <button
                className="gallery__nav gallery__nav--prev"
                onClick={() => setPhoto((p) => (p - 1 + listing.photos.length) % listing.photos.length)}
                aria-label={t('a11y.prevPhoto')}
              >
                <Icon name="chevronLeft" />
              </button>
              <button
                className="gallery__nav gallery__nav--next"
                onClick={() => setPhoto((p) => (p + 1) % listing.photos.length)}
                aria-label={t('a11y.nextPhoto')}
              >
                <Icon name="chevronRight" />
              </button>
              <span className="gallery__count">{photo + 1} / {listing.photos.length}</span>
            </>
          )}
        </div>
        {listing.photos.length > 1 && (
          <div className="gallery__thumbs">
            {listing.photos.map((p, i) => (
              <button key={p + i} className={cx(i === photo && 'is-active')} onClick={() => setPhoto(i)} aria-label={t('a11y.photo', { n: i + 1, total: listing.photos.length })} aria-current={i === photo}>
                <Photo src={p} alt="" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="detail__layout">
        <div className="detail__main">
          <div className="detail__eyebrow">
            <span>{area}</span>
            <span>·</span>
            <span>{t(`room.${listing.roomType}`)}</span>
            <span className="muted">· {t('detail.views', { n: num(listing.views) })}</span>
          </div>
          <div className="detail__title-row">
            <h1>{title}</h1>
            <button
              className={cx('icon-btn icon-btn--lg', saved && 'is-fav')}
              onClick={() => actions.toggleFavorite(listing.id)}
              aria-label={t('card.save')}
              aria-pressed={saved}
            >
              <Icon name="heart" fill={saved ? 'currentColor' : 'none'} />
            </button>
          </div>

          <div className="detail__badges">
            <span className="pill pill--lg">
              <Icon name="metro" size={16} />
              {listing.metro ? t('card.minMetro', { n: listing.metro.minutes, s: listing.metro.station }) : t('card.noMetro')}
            </span>
            {listing.amenities.includes('bus') && <span className="pill pill--lg"><Icon name="bus" size={16} />{t('am.bus')}</span>}
            {listing.centre && <span className="pill pill--lg"><Icon name="pin" size={16} />{t('card.centre')}</span>}
            <span className={cx('tag', `tag--${listing.gender}`)}>{t('detail.lookingFor')}: {t(`gender.${listing.gender}`)}</span>
            {listing.audience.map((a) => (
              <span key={a} className="pill pill--lg">{t(`aud.${a}`)}</span>
            ))}
          </div>

          <div className="facts">
            {facts.map((f) => (
              <div key={f.label} className="fact">
                <Icon name={f.icon} size={18} />
                <span className="muted">{f.label}</span>
                <strong>{f.value}</strong>
              </div>
            ))}
          </div>

          {lt(listing.description) && (
            <section className="detail__section">
              <h2>{t('detail.about')}</h2>
              <p className="prose">{lt(listing.description)}</p>
            </section>
          )}

          <section className="detail__section">
            <h2>{t('detail.amenities')}</h2>
            <ul className="amenities">
              {listing.amenities.map((a) => (
                <li key={a}><Icon name={AMENITY_ICON[a] ?? 'check'} size={18} />{t(`am.${a}`)}</li>
              ))}
            </ul>
          </section>

          {listing.housemates.length > 0 && (
            <section className="detail__section">
              <h2>{t('detail.housemates')}</h2>
              <div className="mates">
                {listing.housemates.map((m, i) => (
                  <div key={m.name + i} className="mate">
                    <Avatar name={m.name} size={44} />
                    <div>
                      <strong>{m.name}{m.age ? `, ${m.age}` : ''}</strong>
                      <span className="muted">{m.occupation}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="detail__section">
            <h2>{t('detail.rules')}</h2>
            <ul className="amenities">
              <li className={cx(!listing.smoking && 'is-no')}><Icon name="smoke" size={18} />{listing.smoking ? t('detail.smokingYes') : t('detail.smokingNo')}</li>
              <li className={cx(!listing.pets && 'is-no')}><Icon name="paw" size={18} />{listing.pets ? t('detail.petsYes') : t('detail.petsNo')}</li>
            </ul>
          </section>

          <section className="detail__section">
            <h2>{t('detail.location')}</h2>
            <div className="map">
              <iframe
                title={t('detail.location')}
                src={location ? osmEmbed(location.lat, location.lng, 0.006, true) : osmEmbed(listing.approxLat, listing.approxLng, 0.012, false)}
                loading="lazy"
              />
              {!location && <span className="map__circle" aria-hidden="true" />}
            </div>
            {location ? (
              <p className="map__caption"><Icon name="pin" size={16} /><strong>{t('detail.exact')}:</strong> {location.address}, {area}</p>
            ) : (
              <p className="map__caption muted"><Icon name="lock" size={16} />{area}. {t('detail.approx')}</p>
            )}
          </section>
        </div>

        <aside className="detail__side">
          <div className="contact-card">
            <div className="price price--lg">{money(listing.price)}</div>
            <small className="muted">{t('card.perMonth')}</small>

            <div className="host">
              <Avatar name={listing.host.name} size={44} />
              <div>
                <strong>
                  {listing.host.name}
                  {listing.host.verified && <Icon name="shield" size={16} className="host__shield" />}
                </strong>
                <span className="muted small">{t('detail.host')} · {t('detail.hostSince', { d: date(listing.host.since) })}</span>
              </div>
            </div>

            {showLocked ? (
              <div className="locked">
                <div className="locked__phone"><Icon name="lock" size={16} />{maskPhone('')}</div>
                <strong>{t('detail.locked')}</strong>
                <p className="muted small">{t('detail.lockedHint')}</p>
                <PlanOptions compact onPick={setBuying} />
              </div>
            ) : contact ? (
              <div className="contact-actions">
                <a className="btn btn--dark btn--block btn--lg" href={`tel:${contact.phone}`}>
                  <Icon name="phone" size={18} />
                  {formatPhone(contact.phone)}
                </a>
                {contact.telegram && (
                  <a className="btn btn--outline btn--block" href={`https://t.me/${contact.telegram}`} target="_blank" rel="noreferrer">
                    <Icon name="send" size={18} />
                    {t('detail.telegram')}
                  </a>
                )}
              </div>
            ) : (
              <button className="btn btn--lime btn--block btn--lg" onClick={reveal}>
                <Icon name="phone" size={18} />
                {t('detail.showPhone')}
              </button>
            )}

            <p className="safety"><Icon name="info" size={16} />{t('detail.safety')}</p>
          </div>
        </aside>
      </div>
      {buying && <PayModal plan={buying} onClose={() => setBuying(null)} />}
    </div>
  );
}
