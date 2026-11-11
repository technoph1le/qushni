'use client';

import Link from 'next/link';
import { Icon } from '../../components/Icon';
import { Photo } from '../../components/ui';
import { cityName, districtName } from '../../data/places';
import { useI18n } from '../../i18n';
import type { Listing } from '../../types';
import { listingTitle } from '../listings/title';
import type { MatchResult } from './api';

/** The matcher's picks, above the normal results: score, the reason in one line, and a few tags. */
export function MatchPicks({
  result,
  listings,
  onRedo,
  onHide,
}: {
  result: MatchResult;
  listings: Listing[];
  onRedo: () => void;
  onHide: () => void;
}) {
  const { t, lt, lang, money } = useI18n();
  const byId = new Map(listings.map((l) => [l.id, l]));
  const picks = result.matches.flatMap((m) => {
    const l = byId.get(m.id);
    return l ? [{ m, l }] : [];
  });

  return (
    <section className="picks" id="picks" aria-labelledby="picks-title">
      <div className="picks__head">
        <div>
          <p className="picks__eyebrow">
            <Icon name="sparkle" size={16} />
            {result.ai ? t('ai.picksAi') : t('ai.picks')}
            {result.considered > 0 && <span className="picks__considered">· {t('ai.considered', { n: result.considered })}</span>}
          </p>
          <h2 className="picks__title" id="picks-title">{picks.length ? result.headline : t('ai.noMatches')}</h2>
          {result.understood.length > 0 && (
            <ul className="picks__understood" aria-label={t('ai.understood')}>
              {result.understood.map((u) => (
                <li key={u}>{u}</li>
              ))}
            </ul>
          )}
        </div>
        <div className="picks__actions">
          <button className="btn btn--outline" onClick={onRedo}>
            <Icon name="edit" size={16} />
            {t('ai.redo')}
          </button>
          <button className="icon-btn" onClick={onHide} aria-label={t('ai.hide')}>
            <Icon name="x" size={18} />
          </button>
        </div>
      </div>

      {picks.length > 0 && (
        <ol className="picks__list">
          {picks.map(({ m, l }, i) => (
            <li key={l.id} className="pick" style={{ animationDelay: `${i * 70}ms` }}>
              <div className="pick__media">
                <Photo src={l.photos[0]} alt="" />
                <span className="pick__score" style={{ ['--p' as string]: `${m.score}%` }}>
                  <strong>{m.score}%</strong>
                  <small>{t('ai.match')}</small>
                </span>
              </div>
              <div className="pick__body">
                <p className="price">
                  {money(l.price)} <small>{t('card.perMonth')}</small>
                </p>
                <Link href={`/listing/${l.id}`} className="card__title">
                  {listingTitle(l, lt, t)}
                </Link>
                <p className="card__where">
                  {districtName(l.city, l.district, lang)}, {cityName(l.city, lang)}
                </p>
                <p className="pick__reason">
                  <Icon name="sparkle" size={15} />
                  {m.reason}
                </p>
                {m.highlights.length > 0 && (
                  <p className="card__tags">
                    {m.highlights.map((h) => (
                      <span key={h} className="tag tag--plain">{h}</span>
                    ))}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
