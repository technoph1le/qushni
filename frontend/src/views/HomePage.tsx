'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Icon } from '../components/Icon';
import { ListingCard } from '../features/listings/ListingCard';
import { Chip, Select } from '../components/ui';
import type { Gender, Listing } from '../types';
import { CITIES, REGIONS, regionById } from '../data/places';
import { BUDGET_PRESETS, DEFAULT_SEARCH, searchListings, type SearchState } from '../features/listings/filters';
import { useListings } from '../data/useListings';
import { useAuth } from '../features/auth/AuthProvider';
import { PayModal, PlanOptions } from '../features/payments/Plans';
import type { Plan } from '../config';
import { useI18n } from '../i18n';

export function HomePage({ initialListings }: { initialListings: Listing[] }) {
  const { t, lang, money } = useI18n();
  const { listings, loading } = useListings(initialListings);
  const { access } = useAuth();
  const [search, setSearch] = useState<SearchState>(DEFAULT_SEARCH);
  const [buying, setBuying] = useState<Plan | null>(null);
  const set = <K extends keyof SearchState>(k: K, v: SearchState[K]) => setSearch((s) => ({ ...s, [k]: v }));

  const { compatriots, others } = useMemo(() => searchListings(listings, search), [listings, search]);
  const region = regionById(search.from);
  const narrowed = search.gender !== '' || search.maxPrice > 0;

  return (
    <>
      <section className="hero">
        <div className="container hero__inner">
          <h1 className="hero__title">{t('hero.title')}</h1>
          <p className="hero__lead">{t('hero.lead')}</p>

          <form
            className="searchbar"
            onSubmit={(e) => {
              e.preventDefault();
              document.getElementById('listings')?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            <Select label={t('hero.city')} icon={<Icon name="pin" size={20} />} value={search.city} onChange={(e) => set('city', e.target.value)}>
              <option value="">{t('hero.cityAny')}</option>
              {CITIES.map((c) => (
                <option key={c.id} value={c.id}>{c.name[lang]}</option>
              ))}
            </Select>
            <Select label={t('hero.from')} icon={<Icon name="users" size={20} />} value={search.from} onChange={(e) => set('from', e.target.value)}>
              <option value="">{t('hero.fromAny')}</option>
              {REGIONS.map((r) => (
                <option key={r.id} value={r.id}>{r.name[lang]}</option>
              ))}
            </Select>
            <button type="submit" className="btn btn--accent btn--lg searchbar__btn">
              <Icon name="search" size={20} />
              {t('hero.search')}
            </button>
          </form>
        </div>
      </section>

      <section className="section section--results" id="listings" aria-labelledby="results-title">
        <div className="container">
          <div className="quickbar" role="group" aria-label={t('list.narrow')}>
            <div className="chips">
              {(['', 'male', 'female'] as (Gender | '')[]).map((g) => (
                <Chip key={g || 'all'} active={search.gender === g} onClick={() => set('gender', g)}>
                  {g ? t(`gender.${g}`) : t('list.everyone')}
                </Chip>
              ))}
            </div>
            <Select aria-label={t('hero.budget')} icon={<Icon name="wallet" size={18} />} value={search.maxPrice} onChange={(e) => set('maxPrice', Number(e.target.value))} className="quickbar__budget">
              <option value={0}>{t('hero.anyBudget')}</option>
              {BUDGET_PRESETS.map((b) => (
                <option key={b} value={b}>{t('hero.upTo', { v: money(b) })}</option>
              ))}
            </Select>
          </div>

          {loading ? (
            <div className="empty"><span className="spinner" aria-hidden="true" />{t('common.loading')}</div>
          ) : (
            <>
              {region && (
                <div className="results">
                  <h2 className="results__title" id="results-title">
                    <Icon name="users" size={22} />
                    {t('list.compatriots', { from: region.from[lang] })}
                    <span className="results__count" role="status">{compatriots.length}</span>
                  </h2>
                  {compatriots.length > 0 ? (
                    <div className="grid grid--3">
                      {compatriots.map((l) => <ListingCard key={l.id} listing={l} />)}
                    </div>
                  ) : (
                    <p className="results__none">{t('list.noCompatriots')}</p>
                  )}
                </div>
              )}

              <div className="results">
                <h2 className="results__title" id={region ? undefined : 'results-title'}>
                  {region ? t('list.others') : t('list.all')}
                  <span className="results__count" role={region ? undefined : 'status'}>{others.length}</span>
                </h2>
                {others.length > 0 ? (
                  <div className="grid grid--3">
                    {others.map((l) => <ListingCard key={l.id} listing={l} />)}
                  </div>
                ) : (
                  <div className="empty">
                    <strong>{t('list.empty')}</strong>
                    {narrowed && (
                      <button className="btn btn--outline" onClick={() => setSearch((s) => ({ ...s, gender: '', maxPrice: 0 }))}>
                        {t('list.clear')}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </section>

      <section className="host-band">
        <div className="container host-band__inner">
          <div>
            <h2>{t('how.host.t')}</h2>
            <p>{t('how.host.d')}</p>
          </div>
          <Link href="/dashboard/new" className="btn btn--accent btn--lg">
            <Icon name="plus" size={18} />
            {t('how.host.cta')}
          </Link>
        </div>
      </section>

      <section className="section" id="plans" aria-labelledby="plans-title">
        <div className="container">
          <div className="plans-head">
            <p className="eyebrow">{t('plans.eyebrow')}</p>
            <h2 className="section__title" id="plans-title">{access.paywallOn ? t('pay.title') : t('plans.title')}</h2>
            <p className="muted">{t('plans.lead')}</p>
          </div>
          <div className="plans">
            {!access.paywallOn && (
              <div className="plan plan--free">
                <span className="plan__name">{t('plans.free.t')}</span>
                <span className="plan__price">{t('plans.free.price')}</span>
                <ul className="checklist">
                  <li><Icon name="check" size={16} />{t('plans.free.f1')}</li>
                  <li><Icon name="check" size={16} />{t('plans.free.f2')}</li>
                  <li><Icon name="check" size={16} />{t('plans.free.f3')}</li>
                </ul>
              </div>
            )}
            <PlanOptions onPick={setBuying} />
          </div>
          <p className="plans-note">
            <Icon name="info" size={16} />
            {t('plans.hostsFree')}
          </p>
        </div>
      </section>

      {buying && <PayModal plan={buying} onClose={() => setBuying(null)} />}
    </>
  );
}
