import type { Audience, Gender, Listing, RoomType } from '../../types';

export type SortKey = 'new' | 'cheap' | 'expensive' | 'metro';

export interface FilterState {
  city: string;
  district: string;
  roomType: RoomType | '';
  maxPrice: number;
  gender: Gender | '';
  audience: Audience | '';
  nearMetro: boolean;
  nearBus: boolean;
  centre: boolean;
  wifi: boolean;
  utilities: boolean;
  verified: boolean;
  sort: SortKey;
}

export const PRICE_MIN = 500000;
export const PRICE_MAX = 4000000;
export const PRICE_STEP = 100000;
export const BUDGET_PRESETS = [1000000, 1500000, 2000000, 3000000];

export const DEFAULT_FILTERS: FilterState = {
  city: '',
  district: '',
  roomType: '',
  maxPrice: PRICE_MAX,
  gender: '',
  audience: '',
  nearMetro: false,
  nearBus: false,
  centre: false,
  wifi: false,
  utilities: false,
  verified: false,
  sort: 'new',
};

export function applyFilters(list: Listing[], f: FilterState): Listing[] {
  const out = list.filter(
    (l) =>
      l.status === 'active' &&
      (!f.city || l.city === f.city) &&
      (!f.district || l.district === f.district) &&
      (!f.roomType || l.roomType === f.roomType) &&
      (f.maxPrice >= PRICE_MAX || l.price <= f.maxPrice) &&
      (!f.gender || l.gender === f.gender || l.gender === 'any') &&
      (!f.audience || l.audience.includes(f.audience)) &&
      (!f.nearMetro || l.amenities.includes('metro') || (l.metro !== null && l.metro.minutes <= 10)) &&
      (!f.nearBus || l.amenities.includes('bus')) &&
      (!f.centre || l.centre) &&
      (!f.wifi || l.amenities.includes('wifi')) &&
      (!f.utilities || l.utilitiesIncluded) &&
      (!f.verified || l.host.verified),
  );
  const metroMin = (l: Listing) => l.metro?.minutes ?? 999;
  const sorters: Record<SortKey, (a: Listing, b: Listing) => number> = {
    new: (a, b) => b.createdAt.localeCompare(a.createdAt),
    cheap: (a, b) => a.price - b.price,
    expensive: (a, b) => b.price - a.price,
    metro: (a, b) => metroMin(a) - metroMin(b),
  };
  return out.sort(sorters[f.sort]);
}

export function activeFilterCount(f: FilterState) {
  return (Object.keys(DEFAULT_FILTERS) as (keyof FilterState)[]).filter(
    (k) => k !== 'sort' && f[k] !== DEFAULT_FILTERS[k],
  ).length;
}
