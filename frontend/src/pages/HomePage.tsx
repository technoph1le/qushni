import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiltersDrawer } from '../features/listings/FiltersDrawer';
import { FiltersPanel } from '../features/listings/FiltersPanel';
import { Icon } from '../components/Icon';
import { ListingCard } from '../features/listings/ListingCard';
import { PayModal, PlanOptions } from '../features/payments/Plans';
import { Select } from '../components/ui';
import type { Plan } from '../config';
import { CITIES, cityById } from '../data/places';
import { activeFilterCount, applyFilters, BUDGET_PRESETS, DEFAULT_FILTERS, PRICE_MAX, type FilterState, type SortKey } from '../features/listings/filters';
import { useAuth } from '../features/auth/AuthProvider';
import { useListings } from '../data/useListings';
import { useI18n } from '../i18n';

export function HomePage() {
  const { t, lang, money, date } = useI18n();
  const { listings, loading } = useListings();
  const { access: acc } = useAuth();
  const paywall = acc.paywallOn;
  const access = acc.has;
  const accessUntil = acc.accessUntil;
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [hero, setHero] = useState({ city: 'tashkent', district: '', maxPrice: PRICE_MAX });
  const [drawer, setDrawer] = useState(false);
  const [buying, setBuying] = useState<Plan | null>(null);

  const results = useMemo(() => applyFilters(listings, filters), [listings, filters]);
  const heroCity = cityById(hero.city);
  const filterCount = activeFilterCount(filters);

  const search = () => {
    setFilters((f) => ({ ...f, ...hero }));
    document.getElementById('listings')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      <section className="hero">
        <div className="container">
          <p className="eyebrow">
            <Icon name="globe" size={14} />
            {t('hero.eyebrow', { n: CITIES.length })}
          </p>
          <div className="hero__row">
            <h1 className="hero__title">
              {t('hero.title1')}
              <em>{t('hero.title2')}</em>
            </h1>
            <p className="hero__lead">{t('hero.lead')}</p>
          </div>

          <form
            className="searchbar"
            onSubmit={(e) => {
              e.preventDefault();
              search();
            }}
          >
            <Select
              label={t('hero.city')}
              icon={<Icon name="pin" size={18} />}
              value={hero.city}
              onChange={(e) => setHero({ ...hero, city: e.target.value, district: '' })}
            >
              {CITIES.map((c) => (
                <option key={c.id} value={c.id}>{c.name[lang]}</option>
              ))}
            </Select>
            <Select
              label={t('hero.district')}
              icon={<Icon name="home" size={18} />}
              value={hero.district}
              onChange={(e) => setHero({ ...hero, district: e.target.value })}
            >
              <option value="">{t('hero.anyDistrict')}</option>
              {heroCity?.districts.map((d) => (
                <option key={d.id} value={d.id}>{d.name[lang]}</option>
              ))}
            </Select>
            <Select
              label={t('hero.budget')}
              icon={<Icon name="wallet" size={18} />}
              value={hero.maxPrice}
              onChange={(e) => setHero({ ...hero, maxPrice: Number(e.target.value) })}
            >
              <option value={PRICE_MAX}>{t('hero.anyBudget')}</option>
              {BUDGET_PRESETS.map((b) => (
                <option key={b} value={b}>{t('hero.upTo', { v: money(b) })}</option>
              ))}
            </Select>
            <button type="submit" className="btn btn--lime btn--lg searchbar__btn">
              <Icon name="search" size={18} />
              {t('hero.search')}
            </button>
          </form>

          <div className="hero__trust">
            <span><Icon name="shield" size={16} />{t('hero.trust1')}</span>
            <span><Icon name="check" size={16} />{t('hero.trust2')}</span>
            <span><Icon name="bolt" size={16} />{t('hero.trust3')}</span>
            <Link to="/dashboard/new" className="hero__post">
              {t('hero.postCta')}
              <Icon name="arrowRight" size={16} />
            </Link>
          </div>
        </div>
      </section>

      <section className="section" id="listings">
        <div className="container">
          <div className="section__head">
            <div>
              <p className="eyebrow">{t('list.eyebrow')}</p>
              <h2 className="section__title">{t('list.title')}</h2>
            </div>
            {paywall && access && accessUntil && (
              <span className="status-pill"><span className="dot" />{t('plans.active', { d: date(accessUntil.slice(0, 10)) })}</span>
            )}
          </div>

          <div className="browse">
            <aside className="browse__side">
              <FiltersPanel value={filters} onChange={setFilters} />
            </aside>

            <div className="browse__main">
              <div className="browse__bar">
                <button className="btn btn--outline btn--sm browse__filter-btn" onClick={() => setDrawer(true)}>
                  <Icon name="filter" size={16} />
                  {t('list.showFilters')}
                  {filterCount > 0 && <span className="count">{filterCount}</span>}
                </button>
                <strong>{t('list.count', { n: results.length })}</strong>
                <label className="sort">
                  <span className="muted">{t('list.sort')}</span>
                  <select value={filters.sort} onChange={(e) => setFilters({ ...filters, sort: e.target.value as SortKey })}>
                    <option value="new">{t('list.sort.new')}</option>
                    <option value="cheap">{t('list.sort.cheap')}</option>
                    <option value="expensive">{t('list.sort.expensive')}</option>
                    <option value="metro">{t('list.sort.metro')}</option>
                  </select>
                </label>
              </div>

              {loading ? (
                <div className="empty"><span className="spinner" />{t('common.loading')}</div>
              ) : results.length === 0 ? (
                <div className="empty">
                  <Icon name="search" size={28} />
                  <strong>{t('list.empty')}</strong>
                  <span className="muted">{t('list.emptyHint')}</span>
                  <button className="btn btn--outline" onClick={() => setFilters(DEFAULT_FILTERS)}>
                    {t('filter.reset')}
                  </button>
                </div>
              ) : (
                <div className="grid">
                  {results.map((l) => (
                    <ListingCard key={l.id} listing={l} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="section section--how" id="how">
        <div className="container how">
          <div className="how__main">
            <p className="eyebrow eyebrow--lime">{t('how.eyebrow')}</p>
            <h2 className="section__title">{t('how.title')}</h2>
            <ol className="steps">
              {(['s1', 's2', 's3'] as const).map((s, i) => (
                <li key={s}>
                  <span className="steps__n">0{i + 1}</span>
                  <div>
                    <strong>{t(`how.${s}.t`)}</strong>
                    <p>{t(`how.${s}.d`)}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
          <div className="host-card">
            <span className="host-card__icon"><Icon name="home" size={26} /></span>
            <h3>{t('how.host.t')}</h3>
            <p>{t('how.host.d')}</p>
            <Link to="/dashboard/new" className="btn btn--lime btn--lg">
              <Icon name="plus" size={18} />
              {t('how.host.cta')}
            </Link>
          </div>
        </div>
      </section>

      <section className="section" id="plans">
        <div className="container">
          <div className="plans-head">
            <p className="eyebrow">{t('plans.eyebrow')}</p>
            <h2 className="section__title">{paywall ? t('pay.title') : t('plans.title')}</h2>
            <p className="muted">{t('plans.lead')}</p>
          </div>
          <div className="plans">
            {!paywall && (
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

      {drawer && (
        <FiltersDrawer value={filters} onChange={setFilters} resultCount={results.length} onClose={() => setDrawer(false)} />
      )}
      {buying && <PayModal plan={buying} onClose={() => setBuying(null)} />}
    </>
  );
}
