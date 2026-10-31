'use client';

import { cloneElement, isValidElement, useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../features/auth/AuthProvider';
import { Icon } from '../../components/Icon';
import { PhoneVerify } from '../../features/auth/PhoneVerify';
import { Chip, Select, Toggle } from '../../components/ui';
import { CITIES, REGIONS, cityById } from '../../data/places';
import { repo } from '../../data/repo';
import { reloadListings } from '../../data/useListings';
import { useI18n, type TKey } from '../../i18n';
import type { Amenity, Gender, ListingDraft, RoomType } from '../../types';
import { compressImage, cx, formatPhone } from '../../lib/utils';

// Three short steps; only the price is required. Everything else has a default or is optional.
const STEPS: TKey[] = ['form.step.where', 'form.step.room', 'form.step.photos'];
const EXTRAS: Amenity[] = ['wifi', 'furniture', 'washer', 'ac', 'heating', 'kitchen', 'fridge', 'parking', 'elevator', 'balcony', 'tv', 'security', 'bus', 'metro'];

function emptyDraft(): ListingDraft {
  const city = CITIES[0];
  return {
    id: null,
    title: '',
    description: '',
    city: city.id,
    district: city.districts[0].id,
    address: '',
    lat: city.lat,
    lng: city.lng,
    metro: null,
    roomType: 'private',
    price: 0,
    utilitiesIncluded: false,
    spots: 1,
    amenities: [],
    gender: 'any',
    origin: null,
    photos: [],
    status: 'active',
  };
}

export function ListingFormPage({ id }: { id?: string }) {
  const { user } = useAuth();
  if (!user) return null;
  return <ListingEditor key={id ?? 'new'} id={id ?? null} userId={user.id} />;
}

function ListingEditor({ id, userId }: { id: string | null; userId: string }) {
  const { t, lang, money } = useI18n();
  const { user } = useAuth();
  const router = useRouter();
  const [l, setL] = useState<ListingDraft | null>(id ? null : emptyDraft());
  const [step, setStep] = useState(0);
  const [error, setError] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [saving, setSaving] = useState(false);
  // Phone confirmation is asked for only when publishing, so nothing typed is lost and the form comes first.
  const [verifying, setVerifying] = useState(false);
  const [locating, setLocating] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!id) return;
    repo.getDraft(id).then((d) => (d ? setL(d) : router.replace('/dashboard/listings')));
  }, [id, router]);

  if (!l) return <div className="empty empty--panel"><span className="spinner" aria-hidden="true" /></div>;

  const set = <K extends keyof ListingDraft>(k: K, v: ListingDraft[K]) => setL((cur) => (cur ? { ...cur, [k]: v } : cur));
  const city = cityById(l.city)!;
  const descText = typeof l.description === 'string' ? l.description : l.description[lang];
  const last = step === STEPS.length - 1;
  const stepValid = (s: number) => s !== 1 || l.price > 0;
  const invalid = error && !stepValid(step);

  const save = async () => {
    setSaving(true);
    setSaveError(false);
    try {
      await repo.saveListing(userId, { ...l, description: descText });
      reloadListings();
      router.push('/dashboard/listings');
    } catch (err) {
      console.error(err);
      setSaveError(true);
      setSaving(false);
    }
  };

  const next = () => {
    if (!stepValid(step)) return setError(true);
    setError(false);
    if (!last) {
      setStep(step + 1);
      window.scrollTo(0, 0);
    } else if (!user?.phoneVerified) {
      setVerifying(true);
    } else {
      save();
    }
  };

  const toggleIn = <T,>(arr: T[], v: T) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  const addPhotos = async (files: FileList | null) => {
    if (!files) return;
    const room = 8 - l.photos.length;
    const urls = await Promise.all([...files].slice(0, room).map((f) => compressImage(f)));
    setL((cur) => (cur ? { ...cur, photos: [...cur.photos, ...urls] } : cur));
  };

  const locate = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setL((cur) => (cur ? { ...cur, lat: +pos.coords.latitude.toFixed(5), lng: +pos.coords.longitude.toFixed(5) } : cur));
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };
  const located = l.lat !== city.lat || l.lng !== city.lng;

  return (
    <>
      <div className="dash__head">
        <h1>{id ? t('dash.edit') : t('dash.new')}</h1>
      </div>

      <ol className="stepper">
        {STEPS.map((s, i) => (
          <li key={s} className={cx(i === step && 'is-current', i < step && 'is-done')}>
            <button type="button" onClick={() => i < step && setStep(i)} disabled={i > step}>
              <span className="stepper__n">{i < step ? <Icon name="check" size={14} /> : i + 1}</span>
              <span className="stepper__label">{t(s)}</span>
            </button>
          </li>
        ))}
      </ol>

      <form
        className="panel form"
        onSubmit={(e) => {
          e.preventDefault();
          next();
        }}
      >
        {step === 0 && (
          <>
            <div className="form__row">
              <Select
                label={t('form.city')}
                value={l.city}
                onChange={(e) => {
                  const c = cityById(e.target.value)!;
                  setL((cur) =>
                    cur
                      ? {
                          ...cur, city: c.id, district: c.districts[0].id, lat: c.lat, lng: c.lng, metro: null,
                          // "Near metro" means nothing in a city without one.
                          amenities: c.metro.length ? cur.amenities : cur.amenities.filter((a) => a !== 'metro'),
                        }
                      : cur,
                  );
                }}
              >
                {CITIES.map((c) => <option key={c.id} value={c.id}>{c.name[lang]}</option>)}
              </Select>
              {/* Cities without a district list have a single "centre" entry: nothing to choose. */}
              {city.districts.length > 1 && (
                <Select label={t('form.district')} value={l.district} onChange={(e) => set('district', e.target.value)}>
                  {city.districts.map((d) => <option key={d.id} value={d.id}>{d.name[lang]}</option>)}
                </Select>
              )}
            </div>
            {city.metro.length > 0 && (
              <Select label={t('form.metro')} value={l.metro ?? ''} onChange={(e) => set('metro', e.target.value || null)}>
                <option value="">{t('form.noMetro')}</option>
                {city.metro.map((m) => <option key={m} value={m}>{m}</option>)}
              </Select>
            )}
            <Field label={t('form.address')} hint={t('form.addressHint')}>
              <input value={l.address} onChange={(e) => set('address', e.target.value)} placeholder={t('form.addressPh')} />
            </Field>
            <div className="locate-row">
              <button type="button" className="btn btn--outline" onClick={locate} disabled={locating}>
                <Icon name="locate" size={16} />
                {locating ? t('form.locating') : t('form.useLocation')}
              </button>
              <span className={cx('small', located ? 'locate-row__ok' : 'muted')} role="status">
                {located ? <><Icon name="check" size={14} />{t('form.located')}</> : t('form.locateHint')}
              </span>
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <Field label={t('form.price')} required invalid={invalid} hint={l.price > 0 ? money(l.price) : undefined}>
              <input type="number" inputMode="numeric" min={0} step={50000} value={l.price || ''} onChange={(e) => set('price', Number(e.target.value))} placeholder="1500000" autoFocus />
            </Field>
            <div className="field">
              <span className="field__label">{t('form.roomType')}</span>
              <div className="choice-cards">
                {(['private', 'shared', 'studio'] as RoomType[]).map((r) => (
                  <button type="button" key={r} className={cx('choice-card', l.roomType === r && 'is-active')} onClick={() => set('roomType', r)} aria-pressed={l.roomType === r}>
                    <Icon name={r === 'shared' ? 'users' : r === 'studio' ? 'home' : 'bed'} size={22} />
                    {t(`room.${r}`)}
                  </button>
                ))}
              </div>
            </div>
            <div className="form__row">
              <Stepper label={t('form.spots')} value={l.spots} min={1} max={10} onChange={(v) => set('spots', v)} />
              <div className="field">
                <span className="field__label">{t('form.gender')}</span>
                <div className="chips">
                  {(['any', 'male', 'female'] as Gender[]).map((g) => (
                    <Chip key={g} active={l.gender === g} onClick={() => set('gender', g)}>{t(`gender.${g}`)}</Chip>
                  ))}
                </div>
              </div>
            </div>
            <Field label={t('form.origin')} hint={t('form.originHint')}>
              <select value={l.origin ?? ''} onChange={(e) => set('origin', e.target.value || null)}>
                <option value="">{t('form.originNone')}</option>
                {REGIONS.map((r) => <option key={r.id} value={r.id}>{r.name[lang]}</option>)}
              </select>
            </Field>
            <Toggle checked={l.utilitiesIncluded} onChange={(v) => set('utilitiesIncluded', v)} label={<><Icon name="bolt" size={16} />{t('form.utilities')}</>} />
          </>
        )}

        {step === 2 && (
          <>
            <div className="field">
              <span className="field__label">{t('form.photos')}</span>
              <span className="muted small">{t('form.photosHint')}</span>
              <div className="photo-grid">
                {l.photos.map((p, i) => (
                  <div key={i} className="photo-tile">
                    <img src={p} alt="" />
                    <button type="button" className="photo-tile__x" onClick={() => set('photos', l.photos.filter((_, j) => j !== i))} aria-label={t('form.remove')}>
                      <Icon name="x" size={14} />
                    </button>
                  </div>
                ))}
                {l.photos.length < 8 && (
                  <button type="button" className="photo-add" onClick={() => fileRef.current?.click()}>
                    <Icon name="image" size={24} />
                    {t('form.addPhotos')}
                  </button>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => { addPhotos(e.target.files); e.target.value = ''; }} />
            </div>
            <Field label={t('form.description')}>
              <textarea rows={4} value={descText} onChange={(e) => set('description', e.target.value)} placeholder={t('form.descriptionPh')} />
            </Field>
            <div className="field">
              <span className="field__label">{t('form.extras')}</span>
              <div className="chips">
                {EXTRAS.filter((a) => a !== 'metro' || city.metro.length > 0).map((a) => (
                  <Chip key={a} active={l.amenities.includes(a)} onClick={() => set('amenities', toggleIn(l.amenities, a))}>{t(`am.${a}`)}</Chip>
                ))}
              </div>
            </div>
            {user?.phoneVerified && user.phone && (
              <p className="tip tip--plain">
                <Icon name="phone" size={18} />
                <span>{t('form.contactNote', { phone: formatPhone(user.phone) })}</span>
              </p>
            )}
          </>
        )}

        {invalid && <p className="form__error" role="alert"><Icon name="info" size={16} />{t('form.required')}</p>}
        {saveError && <p className="form__error" role="alert"><Icon name="info" size={16} />{t('form.saveError')}</p>}

        {verifying ? (
          <div className="verify verify--inline">
            <h3>{t('form.verifyTitle')}</h3>
            <p className="muted">{t('verify.d')}</p>
            <PhoneVerify onDone={() => { setVerifying(false); save(); }} />
          </div>
        ) : (
          <div className="form__actions">
            {step > 0 ? (
              <button type="button" className="btn btn--ghost" onClick={() => { setStep(step - 1); setError(false); }}>
                <Icon name="chevronLeft" size={16} />
                {t('form.back')}
              </button>
            ) : <span />}
            <button type="submit" className={cx('btn btn--lg', last ? 'btn--accent' : 'btn--dark')} disabled={saving}>
              {saving ? t('form.saving') : last ? (id ? t('form.saveChanges') : t('form.publish')) : t('form.next')}
              {!last && <Icon name="arrowRight" size={16} />}
            </button>
          </div>
        )}
      </form>
    </>
  );
}

function Field({ label, hint, required, invalid, children }: { label: string; hint?: string; required?: boolean; invalid?: boolean; children: ReactNode }) {
  const hintId = useId();
  // Tell assistive tech about required/invalid state and the hint, not just the visual cues.
  const control = isValidElement<Record<string, unknown>>(children)
    ? cloneElement(children, {
        'aria-required': required || undefined,
        'aria-invalid': invalid || undefined,
        'aria-describedby': hint ? hintId : undefined,
      })
    : children;
  return (
    <label className={cx('input', invalid && 'is-invalid')}>
      <span>{label}{required && <em aria-hidden="true"> *</em>}</span>
      {control}
      {hint && <small id={hintId} className="muted">{hint}</small>}
    </label>
  );
}

function Stepper({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (v: number) => void }) {
  const { t } = useI18n();
  const labelId = useId();
  return (
    <div className="input" role="group" aria-labelledby={labelId}>
      <span id={labelId}>{label}</span>
      <span className="num-stepper">
        <button type="button" onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min} aria-label={`${t('a11y.decrease')}: ${label}`}>−</button>
        <strong aria-live="polite">{value}</strong>
        <button type="button" onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max} aria-label={`${t('a11y.increase')}: ${label}`}>+</button>
      </span>
    </div>
  );
}
