'use client';

import { useState, type ReactNode, type SelectHTMLAttributes } from 'react';
import Link from 'next/link';
import { LANGS, useI18n } from '../i18n';
import { cx } from '../lib/utils';
import { Icon } from './Icon';

export function Logo() {
  const { t } = useI18n();
  return (
    <Link href="/" className="logo" aria-label="Qo'shni">
      <img src="/logo-wordmark.svg" alt="" width={1194} height={440} className="logo__img" />
      <small className="logo__tag">{t('brand.tagline')}</small>
    </Link>
  );
}

export function LangSwitch() {
  const { lang, setLang, t } = useI18n();
  return (
    <div className="lang" role="group" aria-label={t('a11y.language')}>
      {LANGS.map((l) => (
        <button
          key={l.id}
          type="button"
          className={cx('lang__btn', lang === l.id && 'is-active')}
          onClick={() => setLang(l.id)}
          title={l.label}
          aria-label={l.label}
          lang={l.id}
          aria-pressed={lang === l.id}
        >
          {l.short}
        </button>
      ))}
    </div>
  );
}

export function Select({
  label,
  icon,
  className,
  children,
  ...rest
}: { label?: string; icon?: ReactNode } & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <label className={cx('select', className)}>
      {label && <span className="select__label">{label}</span>}
      <span className="select__control">
        {icon}
        <select {...rest}>{children}</select>
        <Icon name="chevronDown" size={16} className="select__chev" />
      </span>
    </label>
  );
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: ReactNode }) {
  return (
    <label className="toggle">
      <span className="toggle__label">{label}</span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="toggle__track" aria-hidden="true" />
    </label>
  );
}

export function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" className={cx('chip', active && 'is-active')} onClick={onClick} aria-pressed={active}>
      {children}
    </button>
  );
}

export function Photo({ src, alt, className }: { src?: string; alt: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <div className={cx('photo photo--empty', className)} role="img" aria-label={alt}>
        <Icon name="home" size={36} />
      </div>
    );
  }
  return <img className={cx('photo', className)} src={src} alt={alt} loading="lazy" onError={() => setFailed(true)} />;
}

export function Avatar({ name, size = 28 }: { name: string; size?: number }) {
  const hues = [24, 150, 210, 280, 340, 45];
  const hue = hues[(name.charCodeAt(0) || 0) % hues.length];
  return (
    <span
      className="avatar"
      style={{ width: size, height: size, background: `hsl(${hue} 70% 90%)`, color: `hsl(${hue} 45% 32%)` }}
    >
      {name.charAt(0).toUpperCase()}
    </span>
  );
}
