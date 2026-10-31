import type { Metadata } from 'next';
import { cityName, districtName } from '../../../../data/places';
import { fetchPublicListing } from '../../../../data/server';
import { getServerLang, serverT } from '../../../../i18n/server';
import { listingTitle } from '../../../../features/listings/title';
import type { LocalizedText } from '../../../../types';
import { ListingPage } from '../../../../views/ListingPage';

type Props = { params: Promise<{ id: string }> };

export const dynamic = 'force-dynamic';

const text = (v: LocalizedText, lang: 'uz' | 'ru' | 'en') => (typeof v === 'string' ? v : v[lang] || v.uz);

// Gives every listing its own title, description and photo in Google results and Telegram link previews.
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const listing = await fetchPublicListing(id);
  if (!listing) return { title: "E'lon topilmadi", robots: { index: false } };
  const lang = await getServerLang();
  const title = listingTitle(listing, (v) => text(v, lang), (k) => serverT(lang, k));
  const place = `${districtName(listing.city, listing.district, lang)}, ${cityName(listing.city, lang)}`;
  const price = `${new Intl.NumberFormat('ru-RU').format(listing.price).replace(/ /g, ' ')} so'm`;
  const description = `${price} · ${place}. ${text(listing.description, lang).slice(0, 150)}`.trim();
  return {
    title,
    description,
    alternates: { canonical: `/listing/${id}` },
    openGraph: {
      type: 'article',
      title: `${title} — ${price}`,
      description,
      images: listing.photos.length ? [{ url: listing.photos[0] }] : [{ url: '/og-image.png', width: 1200, height: 630 }],
    },
  };
}

export default async function Page({ params }: Props) {
  const { id } = await params;
  const listing = await fetchPublicListing(id);
  return <ListingPage key={id} id={id} initialListing={listing} />;
}
