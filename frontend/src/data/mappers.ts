import type { Listing, ListingDraft } from '../types';

/** Converts between database rows and app objects. Safe to use on both server and browser. */

export const LISTING_COLUMNS =
  'id, status, city, district, metro_station, room_type, price, spots, gender, origin, utilities_included, ' +
  'amenities, title, description, photos';

export type Row = Record<string, any>;

export function rowToFields(r: Row) {
  return {
    title: r.title ?? '',
    description: r.description ?? '',
    city: r.city,
    district: r.district,
    metro: r.metro_station ?? null,
    roomType: r.room_type,
    price: r.price,
    utilitiesIncluded: r.utilities_included,
    spots: r.spots,
    amenities: r.amenities ?? [],
    gender: r.gender,
    origin: r.origin ?? null,
    photos: r.photos ?? [],
    status: r.status ?? 'active',
  } as const;
}

export function publicRowToListing(r: Row): Listing {
  return {
    id: r.id,
    ...rowToFields(r),
    approxLat: r.approx_lat,
    approxLng: r.approx_lng,
    host: {
      name: r.host_name || '—',
      verified: r.host_verified,
      since: String(r.host_since).slice(0, 7),
      hasTelegram: r.host_has_telegram,
    },
    createdAt: String(r.created_at).slice(0, 10),
    views: r.views,
    contacts: r.contacts,
  };
}

export function draftToRow(d: ListingDraft) {
  const text = (v: ListingDraft['title']) => (typeof v === 'string' ? v : v.uz);
  return {
    status: d.status === 'blocked' ? 'paused' : d.status,
    city: d.city,
    district: d.district,
    address: d.address.trim(),
    lat: d.lat,
    lng: d.lng,
    metro_station: d.metro,
    room_type: d.roomType,
    price: d.price,
    spots: d.spots,
    gender: d.gender,
    origin: d.origin,
    utilities_included: d.utilitiesIncluded,
    amenities: d.amenities,
    title: text(d.title).trim(),
    description: text(d.description).trim(),
    photos: d.photos,
  };
}
