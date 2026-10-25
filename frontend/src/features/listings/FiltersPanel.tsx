import { CITIES, cityById } from '../../data/places';
import { DEFAULT_FILTERS, PRICE_MAX, PRICE_MIN, PRICE_STEP, type FilterState } from './filters';
import { useI18n } from '../../i18n';
import type { Audience, Gender, RoomType } from '../../types';
import { Icon } from '../../components/Icon';
import { Chip, Select, Toggle } from '../../components/ui';

interface Props {
  value: FilterState;
  onChange: (f: FilterState) => void;
}

export function FiltersPanel({ value: f, onChange }: Props) {
  const { t, lang, money } = useI18n();
  const set = <K extends keyof FilterState>(k: K, v: FilterState[K]) => onChange({ ...f, [k]: v });
  const city = cityById(f.city);

  return (
    <div className="filters">
      <div className="filters__head">
        <h3>{t('list.filters')}</h3>
        <button className="link-btn" onClick={() => onChange({ ...DEFAULT_FILTERS, sort: f.sort })}>
          {t('filter.reset')}
        </button>
      </div>

      <Select label={t('filter.city')} value={f.city} onChange={(e) => onChange({ ...f, city: e.target.value, district: '' })}>
        <option value="">{t('filter.any')}</option>
        {CITIES.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name[lang]}
          </option>
        ))}
      </Select>

      <Select
        label={t('filter.district')}
        value={f.district}
        disabled={!city}
        onChange={(e) => set('district', e.target.value)}
      >
        <option value="">{t('hero.anyDistrict')}</option>
        {city?.districts.map((d) => (
          <option key={d.id} value={d.id}>
            {d.name[lang]}
          </option>
        ))}
      </Select>

      <div className="field">
        <span className="field__label">{t('filter.roomType')}</span>
        <div className="chips">
          {(['', 'private', 'shared', 'studio'] as (RoomType | '')[]).map((r) => (
            <Chip key={r || 'any'} active={f.roomType === r} onClick={() => set('roomType', r)}>
              {r ? t(`room.${r}`) : t('filter.any')}
            </Chip>
          ))}
        </div>
      </div>

      <div className="field">
        <span className="field__label">{t('filter.budget')}</span>
        <strong className="field__value">
          {f.maxPrice >= PRICE_MAX ? t('hero.anyBudget') : t('hero.upTo', { v: money(f.maxPrice) })}
        </strong>
        <input
          type="range"
          className="range"
          aria-label={t('filter.budget')}
          aria-valuetext={f.maxPrice >= PRICE_MAX ? t('hero.anyBudget') : money(f.maxPrice)}
          min={PRICE_MIN}
          max={PRICE_MAX}
          step={PRICE_STEP}
          value={f.maxPrice}
          onChange={(e) => set('maxPrice', Number(e.target.value))}
          style={{ ['--p' as string]: `${((f.maxPrice - PRICE_MIN) / (PRICE_MAX - PRICE_MIN)) * 100}%` }}
        />
      </div>

      <div className="field">
        <span className="field__label">{t('filter.gender')}</span>
        <div className="chips">
          {(['', 'male', 'female'] as (Gender | '')[]).map((g) => (
            <Chip key={g || 'any'} active={f.gender === g} onClick={() => set('gender', g)}>
              {g ? t(`gender.${g}`) : t('filter.any')}
            </Chip>
          ))}
        </div>
      </div>

      <div className="field">
        <span className="field__label">{t('filter.audience')}</span>
        <div className="chips">
          {(['', 'students', 'workers', 'family'] as (Audience | '')[]).map((a) => (
            <Chip key={a || 'any'} active={f.audience === a} onClick={() => set('audience', a)}>
              {a ? t(`aud.${a}`) : t('filter.any')}
            </Chip>
          ))}
        </div>
      </div>

      <div className="filters__toggles">
        <Toggle checked={f.nearMetro} onChange={(v) => set('nearMetro', v)} label={<><Icon name="metro" size={16} />{t('filter.nearMetro')}</>} />
        <Toggle checked={f.nearBus} onChange={(v) => set('nearBus', v)} label={<><Icon name="bus" size={16} />{t('filter.nearBus')}</>} />
        <Toggle checked={f.centre} onChange={(v) => set('centre', v)} label={<><Icon name="pin" size={16} />{t('filter.centre')}</>} />
        <Toggle checked={f.wifi} onChange={(v) => set('wifi', v)} label={<><Icon name="wifi" size={16} />{t('filter.wifi')}</>} />
        <Toggle checked={f.utilities} onChange={(v) => set('utilities', v)} label={<><Icon name="bolt" size={16} />{t('filter.utilities')}</>} />
        <Toggle checked={f.verified} onChange={(v) => set('verified', v)} label={<><Icon name="shield" size={16} />{t('filter.verified')}</>} />
      </div>
    </div>
  );
}
