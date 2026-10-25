import { createContext, Fragment, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Lang, LocalizedText } from '../types';
import { en, type TKey } from './en';
import { ru } from './ru';
import { uz } from './uz';

const DICTS = { uz, ru, en };
export const LANGS: { id: Lang; label: string; short: string }[] = [
  { id: 'uz', label: "O'zbekcha", short: 'UZ' },
  { id: 'ru', label: 'Русский', short: 'RU' },
  { id: 'en', label: 'English', short: 'EN' },
];

const LOCALES: Record<Lang, string> = { uz: 'uz-Latn-UZ', ru: 'ru-RU', en: 'en-GB' };

const MONTHS: Record<Lang, string[]> = {
  uz: ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr'],
  ru: ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'],
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
};

type Vars = Record<string, string | number>;

interface I18n {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: TKey, vars?: Vars) => string;
  /** Like t(), but {placeholders} can be React elements such as links. */
  tx: (key: TKey, parts: Record<string, ReactNode>) => ReactNode[];
  lt: (text: LocalizedText) => string;
  money: (v: number) => string;
  num: (v: number) => string;
  date: (iso: string) => string;
}

const Ctx = createContext<I18n | null>(null);

function initialLang(): Lang {
  try {
    const saved = localStorage.getItem('qoshni.lang');
    if (saved === 'uz' || saved === 'ru' || saved === 'en') return saved;
  } catch {
    /* storage unavailable */
  }
  const nav = navigator.language.slice(0, 2);
  return nav === 'ru' ? 'ru' : nav === 'en' ? 'en' : 'uz';
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem('qoshni.lang', l);
    } catch {
      /* storage unavailable */
    }
  }, []);

  const value = useMemo<I18n>(() => {
    const dict = DICTS[lang];
    const fmt = new Intl.NumberFormat(LOCALES[lang]);
    const num = (v: number) => fmt.format(v).replace(/[  ,.]/g, ' ');
    const t = (key: TKey, vars?: Vars) => {
      let s: string = dict[key] ?? en[key] ?? key;
      if (vars) for (const [k, v] of Object.entries(vars)) s = s.split(`{${k}}`).join(String(v));
      return s;
    };
    return {
      lang,
      setLang,
      t,
      lt: (text) => (typeof text === 'string' ? text : text[lang] || text.uz),
      tx: (key, parts) =>
        dict[key].split(/(\{\w+\})/).map((chunk, i) => {
          const name = chunk.match(/^\{(\w+)\}$/)?.[1];
          return name && name in parts ? <Fragment key={i}>{parts[name]}</Fragment> : chunk;
        }),
      num,
      money: (v) => t('common.sum', { v: num(v) }),
      date: (iso) => {
        const [y, m, d] = iso.split('-').map(Number);
        if (!m) return iso;
        const month = MONTHS[lang][m - 1];
        if (!d) return `${month} ${y}`;
        return lang === 'uz' ? `${d}-${month}` : `${d} ${month}`;
      },
    };
  }, [lang, setLang]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useI18n() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useI18n must be used inside I18nProvider');
  return ctx;
}

export type { TKey };
