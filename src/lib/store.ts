'use client';

import { useSyncExternalStore } from 'react';

/** Per-browser preferences kept in localStorage. */
interface State {
  favorites: string[];
  paywallPreview: boolean;
}

const KEY = 'qoshni.state.v3';
const DEFAULT_STATE: State = { favorites: [], paywallPreview: false };

let state: State = DEFAULT_STATE;
let hydrated = false;
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((l) => l());

/**
 * Loads saved state after the first render. The server and the first browser render both use
 * DEFAULT_STATE, so React's hydration matches; saved favourites appear a moment later.
 */
export function hydrateStore() {
  if (hydrated) return;
  hydrated = true;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) state = { ...DEFAULT_STATE, ...JSON.parse(raw) };
  } catch {
    /* storage unavailable or corrupt */
  }
  // The paid-mode preview is a development tool; real users always see the real paywall state.
  if (process.env.NODE_ENV === 'development') {
    const p = new URLSearchParams(window.location.search).get('paywall');
    if (p === '1') state = { ...state, paywallPreview: true };
    if (p === '0') state = { ...state, paywallPreview: false };
  } else {
    state = { ...state, paywallPreview: false };
  }
  emit();
}

function setState(patch: Partial<State> | ((s: State) => Partial<State>)) {
  const next = typeof patch === 'function' ? patch(state) : patch;
  state = { ...state, ...next };
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* quota exceeded or storage unavailable — keep in memory */
  }
  emit();
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useStore<T>(selector: (s: State) => T): T {
  return useSyncExternalStore(
    subscribe,
    () => selector(state),
    () => selector(DEFAULT_STATE),
  );
}

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
