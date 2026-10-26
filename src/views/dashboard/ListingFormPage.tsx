import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../features/auth/AuthProvider';
import { Icon } from '../../components/Icon';
import { PhoneVerify } from '../../features/auth/PhoneVerify';
import { Chip, Select, Toggle } from '../../components/ui';
import { CITIES, cityById } from '../../data/places';
import { repo } from '../../data/repo';
import { reloadListings } from '../../data/useListings';
import { useI18n, type TKey } from '../../i18n';
import type { Amenity, Audience, Gender, Lang, ListingDraft, RoomType } from '../../types';
import { compressImage, cx, formatPhone, osmEmbed } from '../../lib/utils';

const AMENITIES: Amenity[] = ['metro', 'bus', 'wifi', 'washer', 'ac', 'heating', 'furniture', 'kitchen', 'fridge', 'parking', 'elevator', 'balcony', 'tv', 'security'];
const STEPS: TKey[] = ['form.step.basics', 'form.step.location', 'form.step.home', 'form.step.people', 'form.step.photos'];

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
    centre: false,
    roomType: 'private',
    price: 0,
    deposit: 0,
    utilitiesIncluded: false,
    spots: 1,
    rooms: 2,
    area: 50,
    floor: 1,
    floors: 5,
    availableFrom: new Date().toISOString().slice(0, 10),
    amenities: ['wifi'],
    gender: 'any',
    audience: ['students'],
    smoking: false,
    pets: false,
    housemates: [],
    photos: [],
    status: 'active',
  };
}

export function ListingFormPage() {
  const { id } = useParams();
  const { t, lang } = useI18n();
  const { user } = useAuth();

  if (!user) return null;
  if (!user.phoneVerified) {
    return (
      <>
        <div className="dash__head">
          <h1>{t('dash.new')}</h1>
        </div>
        <div className="panel verify verify--narrow">
          <span className="host-card__icon"><Icon name="phone" size={24} /></span>
          <h3>{t('verify.t')}</h3>
          <p className="muted">{t('verify.d')}</p>
          <PhoneVerify onDone={() => {}} />
        </div>
      </>
    );
  }
  return <ListingEditor key={id ?? 'new'} id={id ?? null} userId={user.id} phone={user.phone ?? ''} lang={lang} />;
}

function ListingEditor({ id, userId, phone, lang }: { id: string | null; userId: string; phone: string; lang: Lang }) {
  const { t, money } = useI18n();
  const navigate = useNavigate();
  const [l, setL] = useState<ListingDraft | null>(id ? null : emptyDraft());
  const [step, setStep] = useState(0);
  const [error, setError] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!id) return;
    repo.getDraft(id).then((d) => (d ? setL(d) : navigate('/dashboard/listings', { replace: true })));
  }, [id, navigate]);

  if (!l) return <div className="empty empty--panel"><span className="spinner" /></div>;

  const set = <K extends keyof ListingDraft>(k: K, v: ListingDraft[K]) => setL((cur) => (cur ? { ...cur, [k]: v } : cur));
  const city = cityById(l.city)!;
  const titleText = typeof l.title === 'string' ? l.title : l.title[lang];
  const descText = typeof l.description === 'string' ? l.description : l.description[lang];

  const stepValid = (s: number) => {
    if (s === 0) return titleText.trim().length >= 5;
    if (s === 1) return l.address.trim().length > 3;
    if (s === 4) return l.price > 0;
    return true;
  };

  const next = async () => {
    if (!stepValid(step)) return setError(true);
    setError(false);
    if (step < STEPS.length - 1) {
      setStep(step + 1);
      window.scrollTo(0, 0);
      return;
    }
    setSaving(true);
    setSaveError(false);
    try {
      await repo.saveListing(userId, { ...l, title: titleText, description: descText });
      reloadListings();
      navigate('/dashboard/listings');
    } catch (err) {
      console.error(err);
      setSaveError(true);
      setSaving(false);
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

  const invalid = error && !stepValid(step);

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
            <Field label={t('form.title')} required invalid={invalid && titleText.trim().length < 5}>
              <input value={titleText} onChange={(e) => set('title', e.target.value)} placeholder={t('form.titlePh')} maxLength={90} />
            </Field>
            <Field label={t('form.description')}>
              <textarea rows={5} value={descText} onChange={(e) => set('description', e.target.value)} placeholder={t('form.descriptionPh')} />
            </Field>
            <div className="field">
              <span className="field__label">{t('form.roomType')}</span>
              <div className="choice-cards">
                {(['private', 'shared', 'studio'] as RoomType[]).map((r) => (
                  <button type="button" key={r} className={cx('choice-card', l.roomType === r && 'is-active')} onClick={() => set('roomType', r)}>
                    <Icon name={r === 'shared' ? 'users' : r === 'studio' ? 'home' : 'bed'} size={22} />
                    {t(`room.${r}`)}
                  </button>
                ))}
              </div>
            </div>
            <Field label={t('form.spots')}>
              <Stepper value={l.spots} min={1} max={10} onChange={(v) => set('spots', v)} />
            </Field>
          </>
        )}

        {step === 1 && (
          <>
            <div className="form__row">
              <Select
                label={t('form.city')}
                value={l.city}
                onChange={(e) => {
                  const c = cityById(e.target.value)!;
                  setL((cur) => (cur ? { ...cur, city: c.id, district: c.districts[0].id, lat: c.lat, lng: c.lng, metro: null } : cur));
                }}
              >
                {CITIES.map((c) => <option key={c.id} value={c.id}>{c.name[lang]}</option>)}
              </Select>
              <Select label={t('form.district')} value={l.district} onChange={(e) => set('district', e.target.value)}>
                {city.districts.map((d) => <option key={d.id} value={d.id}>{d.name[lang]}</option>)}
              </Select>
            </div>
            <Field label={t('form.address')} required hint={t('form.addressHint')} invalid={invalid}>
              <input value={l.address} onChange={(e) => set('address', e.target.value)} placeholder={t('form.addressPh')} />
            </Field>
            {city.metro.length > 0 && (
              <div className="form__row">
                <Select
                  label={t('form.metro')}
                  value={l.metro?.station ?? ''}
                  onChange={(e) => set('metro', e.target.value ? { station: e.target.value, minutes: l.metro?.minutes ?? 10 } : null)}
                >
                  <option value="">{t('form.noMetro')}</option>
                  {city.metro.map((m) => <option key={m} value={m}>{m}</option>)}
                </Select>
                {l.metro && (
                  <Field label={t('form.metroMin')}>
                    <Stepper value={l.metro.minutes} min={1} max={60} onChange={(v) => set('metro', { station: l.metro!.station, minutes: v })} />
                  </Field>
                )}
              </div>
            )}
            <Toggle checked={l.centre} onChange={(v) => set('centre', v)} label={<><Icon name="pin" size={16} />{t('form.centre')}</>} />
            <div className="field">
              <span className="field__label">{t('form.coords')}</span>
              <div className="map map--sm">
                <iframe title={t('form.coords')} src={osmEmbed(l.lat, l.lng, 0.006, true)} loading="lazy" />
              </div>
              <div className="form__row form__row--3">
                <Field label={t('form.lat')}>
                  <input type="number" step="0.00001" value={l.lat} onChange={(e) => set('lat', Number(e.target.value))} />
                </Field>
                <Field label={t('form.lng')}>
                  <input type="number" step="0.00001" value={l.lng} onChange={(e) => set('lng', Number(e.target.value))} />
                </Field>
                <button type="button" className="btn btn--outline form__locate" onClick={locate} disabled={locating}>
                  <Icon name="locate" size={16} />
                  {locating ? t('form.locating') : t('form.useLocation')}
                </button>
              </div>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div className="form__row form__row--4">
              <Field label={t('form.rooms')}><Stepper value={l.rooms} min={1} max={10} onChange={(v) => set('rooms', v)} /></Field>
              <Field label={t('form.area')}><input type="number" min={5} value={l.area} onChange={(e) => set('area', Number(e.target.value))} /></Field>
              <Field label={t('form.floor')}><input type="number" min={0} value={l.floor} onChange={(e) => set('floor', Number(e.target.value))} /></Field>
              <Field label={t('form.floors')}><input type="number" min={1} value={l.floors} onChange={(e) => set('floors', Number(e.target.value))} /></Field>
            </div>
            <Field label={t('form.available')}>
              <input type="date" value={l.availableFrom} onChange={(e) => set('availableFrom', e.target.value)} />
            </Field>
            <div className="field">
              <span className="field__label">{t('form.amenities')}</span>
              <div className="check-grid">
                {AMENITIES.map((a) => (
                  <label key={a} className={cx('check', l.amenities.includes(a) && 'is-active')}>
                    <input type="checkbox" checked={l.amenities.includes(a)} onChange={() => set('amenities', toggleIn(l.amenities, a))} />
                    <span className="check__box"><Icon name="check" size={14} /></span>
                    {t(`am.${a}`)}
                  </label>
                ))}
              </div>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <div className="field">
              <span className="field__label">{t('form.gender')}</span>
              <div className="chips">
                {(['any', 'male', 'female'] as Gender[]).map((g) => (
                  <Chip key={g} active={l.gender === g} onClick={() => set('gender', g)}>{t(`gender.${g}`)}</Chip>
                ))}
              </div>
            </div>
            <div className="field">
              <span className="field__label">{t('form.audience')}</span>
              <div className="chips">
                {(['students', 'workers', 'family'] as Audience[]).map((a) => (
                  <Chip key={a} active={l.audience.includes(a)} onClick={() => set('audience', toggleIn(l.audience, a))}>{t(`aud.${a}`)}</Chip>
                ))}
              </div>
            </div>
            <div className="form__toggles">
              <Toggle checked={l.smoking} onChange={(v) => set('smoking', v)} label={<><Icon name="smoke" size={16} />{t('form.smoking')}</>} />
              <Toggle checked={l.pets} onChange={(v) => set('pets', v)} label={<><Icon name="paw" size={16} />{t('form.pets')}</>} />
            </div>
            <div className="field">
              <span className="field__label">{t('form.housemates')}</span>
              {l.housemates.map((m, i) => (
                <div key={i} className="mate-row">
                  <input placeholder={t('form.mateName')} value={m.name} onChange={(e) => set('housemates', l.housemates.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} />
                  <input type="number" placeholder={t('form.mateAge')} value={m.age || ''} onChange={(e) => set('housemates', l.housemates.map((x, j) => (j === i ? { ...x, age: Number(e.target.value) } : x)))} />
                  <input placeholder={t('form.mateOcc')} value={m.occupation} onChange={(e) => set('housemates', l.housemates.map((x, j) => (j === i ? { ...x, occupation: e.target.value } : x)))} />
                  <button type="button" className="icon-btn icon-btn--danger" onClick={() => set('housemates', l.housemates.filter((_, j) => j !== i))} aria-label={t('form.remove')}>
                    <Icon name="trash" size={17} />
                  </button>
                </div>
              ))}
              {l.housemates.length < 6 && (
                <button type="button" className="btn btn--outline btn--sm" onClick={() => set('housemates', [...l.housemates, { name: '', age: 0, occupation: '' }])}>
                  <Icon name="plus" size={16} />
                  {t('form.addMate')}
                </button>
              )}
            </div>
          </>
        )}

        {step === 4 && (
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
            <div className="form__row">
              <Field label={t('form.price')} required invalid={invalid && l.price <= 0} hint={l.price > 0 ? money(l.price) : undefined}>
                <input type="number" min={0} step={50000} value={l.price || ''} onChange={(e) => set('price', Number(e.target.value))} placeholder="1500000" />
              </Field>
              <Field label={t('form.deposit')}>
                <input type="number" min={0} step={50000} value={l.deposit || ''} onChange={(e) => set('deposit', Number(e.target.value))} placeholder="0" />
              </Field>
            </div>
            <Toggle checked={l.utilitiesIncluded} onChange={(v) => set('utilitiesIncluded', v)} label={<><Icon name="bolt" size={16} />{t('form.utilities')}</>} />
            <p className="tip tip--plain">
              <Icon name="phone" size={18} />
              <span>{t('form.contactNote', { phone: formatPhone(phone) })}</span>
            </p>
          </>
        )}

        {invalid && <p className="form__error" role="alert"><Icon name="info" size={16} />{t('form.required')}</p>}
        {saveError && <p className="form__error" role="alert"><Icon name="info" size={16} />{t('form.saveError')}</p>}

        <div className="form__actions">
          {step > 0 ? (
            <button type="button" className="btn btn--ghost" onClick={() => { setStep(step - 1); setError(false); }}>
              <Icon name="chevronLeft" size={16} />
              {t('form.back')}
            </button>
          ) : <span />}
          <button type="submit" className={cx('btn btn--lg', step === STEPS.length - 1 ? 'btn--lime' : 'btn--dark')} disabled={saving}>
            {saving ? t('form.saving') : step === STEPS.length - 1 ? (id ? t('form.saveChanges') : t('form.publish')) : t('form.next')}
            {step < STEPS.length - 1 && <Icon name="arrowRight" size={16} />}
          </button>
        </div>
      </form>
    </>
  );
}

function Field({ label, hint, required, invalid, children }: { label: string; hint?: string; required?: boolean; invalid?: boolean; children: ReactNode }) {
  return (
    <label className={cx('input', invalid && 'is-invalid')}>
      <span>{label}{required && <em> *</em>}</span>
      {children}
      {hint && <small className="muted">{hint}</small>}
    </label>
  );
}

function Stepper({ value, min, max, onChange }: { value: number; min: number; max: number; onChange: (v: number) => void }) {
  return (
    <span className="num-stepper">
      <button type="button" onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min} aria-label="−">−</button>
      <strong>{value}</strong>
      <button type="button" onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max} aria-label="+">+</button>
    </span>
  );
}
