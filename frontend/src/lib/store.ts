import { useSyncExternalStore } from 'react';
import type { ListingDraft } from '../types';

export interface DemoUser {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
}

export interface DemoListing extends ListingDraft {
  id: string;
  createdAt: string;
}

interface State {
  favorites: string[];
  paywallPreview: boolean;
  // Demo mode only (no Supabase configured)
  demoUser: DemoUser | null;
  demoListings: DemoListing[];
  demoCounters: Record<string, { views: number; contacts: number }>;
  demoAccessUntil: string | null;
}

const KEY = 'qoshni.state.v2';

const DEFAULT_STATE: State = {
  favorites: [],
  paywallPreview: false,
  demoUser: null,
  demoListings: [],
  demoCounters: {},
  demoAccessUntil: null,
};

function load(): State {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...DEFAULT_STATE, ...JSON.parse(raw) };
  } catch {
    /* storage unavailable or corrupt */
  }
  return DEFAULT_STATE;
}

let state: State = load();

// The paid-mode preview is a development tool; real users always see the real paywall state.
if (import.meta.env.DEV) {
  const params = new URLSearchParams(window.location.search);
  if (params.get('paywall') === '1') state = { ...state, paywallPreview: true };
  if (params.get('paywall') === '0') state = { ...state, paywallPreview: false };
} else {
  state = { ...state, paywallPreview: false };
}

const listeners = new Set<() => void>();

export function setState(patch: Partial<State> | ((s: State) => Partial<State>)) {
  const next = typeof patch === 'function' ? patch(state) : patch;
  state = { ...state, ...next };
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* quota exceeded or storage unavailable — keep in memory */
  }
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useStore<T>(selector: (s: State) => T): T {
  return useSyncExternalStore(subscribe, () => selector(state));
}

export const getState = () => state;

export const actions = {
  toggleFavorite(id: string) {
    setState((s) => ({
      favorites: s.favorites.includes(id) ? s.favorites.filter((f) => f !== id) : [...s.favorites, id],
    }));
  },
  setPaywallPreview(on: boolean) {
    setState({ paywallPreview: on });
  },
};
