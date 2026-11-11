import type { Gender, Lang } from '../../types';
import { BUDGET_PRESETS, type SearchState } from '../listings/filters';

/** The seeker's answers. Every one of them is optional — skipping is always allowed. */
export interface MatchAnswers {
  city: string | null;
  from: string | null;
  who: 'male' | 'female' | 'couple' | null;
  maxPrice: number | null;
  note: string;
}

export const EMPTY_ANSWERS: MatchAnswers = { city: null, from: null, who: null, maxPrice: null, note: '' };

export interface MatchResult {
  /** false = ranked by simple rules (no API key, or the AI call failed). */
  ai: boolean;
  headline: string;
  understood: string[];
  filters: { city: string | null; from: string | null; gender: 'male' | 'female' | null; maxPrice: number | null };
  matches: { id: string; score: number; reason: string; highlights: string[] }[];
  considered: number;
}

export async function requestMatches(a: MatchAnswers, lang: Lang): Promise<MatchResult> {
  const res = await fetch('/api/match', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ lang, city: a.city, from: a.from, who: a.who, maxPrice: a.maxPrice, note: a.note.trim() || null }),
  });
  if (!res.ok) throw new Error(`match ${res.status}`);
  return res.json();
}

/** The page's own filters, filled from what the seeker told us (answers first, then what the AI read from the note). */
export function searchFrom(a: MatchAnswers, r: MatchResult | null): SearchState {
  const price = a.maxPrice ?? r?.filters.maxPrice ?? null;
  const gender: Gender | '' = a.who === 'male' || a.who === 'female' ? a.who : r?.filters.gender ?? '';
  return {
    city: a.city ?? r?.filters.city ?? '',
    from: a.from ?? r?.filters.from ?? '',
    gender,
    // The page's budget menu only has presets; take the smallest one that still covers the budget.
    maxPrice: price ? BUDGET_PRESETS.find((b) => b >= price) ?? 0 : 0,
  };
}
