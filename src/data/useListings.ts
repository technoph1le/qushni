'use client';

import { useEffect, useReducer } from 'react';
import type { Listing } from '../types';
import { repo } from './repo';

let cache: Listing[] | null = null;
let failed = false;
let inflight: Promise<void> | null = null;
const subscribers = new Set<() => void>();

export function reloadListings() {
  inflight = repo
    .listListings()
    .then((list) => {
      cache = list;
      failed = false;
    })
    .catch((err) => {
      console.error(err);
      cache = cache ?? [];
      failed = true;
    })
    .finally(() => {
      inflight = null;
      subscribers.forEach((f) => f());
    });
  return inflight;
}

/** `initial` is the list rendered on the server; it is shown until the browser has fetched its own copy. */
export function useListings(initial?: Listing[]) {
  const [, rerender] = useReducer((x: number) => x + 1, 0);
  useEffect(() => {
    subscribers.add(rerender);
    if (!cache && !inflight) reloadListings();
    return () => {
      subscribers.delete(rerender);
    };
  }, []);
  return { listings: cache ?? initial ?? [], loading: cache === null && !initial, failed };
}
