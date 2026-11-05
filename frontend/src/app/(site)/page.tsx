import type { Metadata } from 'next';
import { COMPANY } from '../../config';
import { fetchPublicListings } from '../../data/server';
import { siteUrl } from '../../lib/site';
import { HomePage } from '../../views/HomePage';

// Listings change all the time; render on every request so new rooms show up immediately.
export const dynamic = 'force-dynamic';

export const metadata: Metadata = { alternates: { canonical: '/' } };

// Tells Google the site's name and logo (shown next to search results).
function structuredData() {
  const base = siteUrl();
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${base}/#org`,
        name: COMPANY.product,
        url: `${base}/`,
        logo: `${base}/icon-512.png`,
        email: COMPANY.email,
        sameAs: [`https://t.me/${COMPANY.telegram}`],
        parentOrganization: { '@type': 'Organization', name: COMPANY.name },
      },
      { '@type': 'WebSite', '@id': `${base}/#site`, name: COMPANY.product, url: `${base}/`, inLanguage: ['uz', 'ru', 'en'], publisher: { '@id': `${base}/#org` } },
    ],
  };
}

export default async function Page() {
  const listings = await fetchPublicListings();
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData()).replace(/</g, '\\u003c') }} />
      {/* Cards never show the description; leaving it out keeps the first HTML small. */}
      <HomePage initialListings={listings.map((l) => ({ ...l, description: '' }))} />
    </>
  );
}
