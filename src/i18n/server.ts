import 'server-only';
import { cookies, headers } from 'next/headers';
import type { Lang } from '../types';
import { en, type TKey } from './en';
import { ru } from './ru';
import { uz } from './uz';

const DICTS = { uz, ru, en };

/** The visitor's language: the saved choice, otherwise their browser language, otherwise Uzbek. */
export async function getServerLang(): Promise<Lang> {
  const saved = (await cookies()).get('lang')?.value;
  if (saved === 'uz' || saved === 'ru' || saved === 'en') return saved;
  const accept = (await headers()).get('accept-language')?.toLowerCase() ?? '';
  for (const part of accept.split(',')) {
    const code = part.trim().slice(0, 2);
    if (code === 'uz' || code === 'ru' || code === 'en') return code;
  }
  return 'uz';
}

/** Translation lookup for server code such as page titles. */
export function serverT(lang: Lang, key: TKey) {
  return DICTS[lang][key] ?? en[key];
}
