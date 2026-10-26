import type { MetadataRoute } from 'next';
import { fetchPublicListings } from '../data/server';
import { siteUrl } from '../lib/site';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const listings = await fetchPublicListings();
  return [
    { url: `${base}/`, changeFrequency: 'hourly', priority: 1 },
    ...listings.map((l) => ({ url: `${base}/listing/${l.id}`, lastModified: l.createdAt, changeFrequency: 'daily' as const, priority: 0.8 })),
    { url: `${base}/privacy`, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${base}/terms`, changeFrequency: 'yearly', priority: 0.2 },
  ];
}
