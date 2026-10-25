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

export function useListings() {
  const [, rerender] = useReducer((x: number) => x + 1, 0);
  useEffect(() => {
    subscribers.add(rerender);
    if (!cache && !inflight) reloadListings();
    return () => {
      subscribers.delete(rerender);
    };
  }, []);
  return { listings: cache ?? [], loading: cache === null, failed };
}
