import type { Gender, Listing } from '../../types';

/** The whole search: where you want to live, where you're from, and two quick narrowing options. */
export interface SearchState {
  city: string;
  from: string; // REGIONS id, '' = not given
  gender: Gender | '';
  maxPrice: number; // 0 = any
}

export const BUDGET_PRESETS = [1000000, 1500000, 2000000, 3000000];

export const DEFAULT_SEARCH: SearchState = { city: '', from: '', gender: '', maxPrice: 0 };

/** Listings in the chosen city, split so compatriots come first. */
export function searchListings(list: Listing[], s: SearchState): { compatriots: Listing[]; others: Listing[] } {
  const found = list
    .filter(
      (l) =>
        l.status === 'active' &&
        (!s.city || l.city === s.city) &&
        (!s.gender || l.gender === s.gender || l.gender === 'any') &&
        (!s.maxPrice || l.price <= s.maxPrice),
    )
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  if (!s.from) return { compatriots: [], others: found };
  return {
    compatriots: found.filter((l) => l.origin === s.from),
    others: found.filter((l) => l.origin !== s.from),
  };
}
