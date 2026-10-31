import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { unstable_cache } from 'next/cache';
import { cache } from 'react';
import type { Listing } from '../types';
import { publicRowToListing } from './mappers';

/** Read-only client with the publishable key: sees exactly what an anonymous visitor sees. */
function publicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

async function queryPublicListings(): Promise<Listing[]> {
  const sb = publicClient();
  if (!sb) return [];
  const { data, error } = await sb.from('public_listings').select('*').order('created_at', { ascending: false }).limit(500);
  if (error) {
    console.error('fetchPublicListings', error.message);
    return [];
  }
  return (data ?? []).map(publicRowToListing);
}

/** Shared across visitors for 30 s, so the home page doesn't wait on the database; the browser refreshes the list right after. */
export const fetchPublicListings = unstable_cache(queryPublicListings, ['public-listings'], { revalidate: 30 });

/** Cached per request, so the page and its metadata share one query. */
export const fetchPublicListing = cache(async (id: string): Promise<Listing | null> => {
  const sb = publicClient();
  if (!sb || !/^[0-9a-f-]{36}$/i.test(id)) return null;
  const { data, error } = await sb.from('public_listings').select('*').eq('id', id).maybeSingle();
  if (error) console.error('fetchPublicListing', error.message);
  return data ? publicRowToListing(data) : null;
});
