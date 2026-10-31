import type { Listing, ListingDraft } from '../types';

/** Converts between database rows and app objects. Safe to use on both server and browser. */

export const LISTING_COLUMNS =
  'id, title, description, city, district, metro_station, metro_minutes, centre, room_type, price, deposit, ' +
  'utilities_included, spots, rooms, area, floor, floors, available_from, amenities, gender, audience, smoking, ' +
  'pets, housemates, photos, status';

export type Row = Record<string, any>;

export function rowToFields(r: Row) {
  return {
    title: r.title,
    description: r.description,
    city: r.city,
    district: r.district,
    metro: r.metro_station ? { station: r.metro_station, minutes: r.metro_minutes ?? 10 } : null,
    centre: r.centre,
    roomType: r.room_type,
    price: r.price,
    deposit: r.deposit,
    utilitiesIncluded: r.utilities_included,
    spots: r.spots,
    rooms: r.rooms,
    area: r.area,
    floor: r.floor,
    floors: r.floors,
    availableFrom: r.available_from,
    amenities: r.amenities ?? [],
    gender: r.gender,
    audience: r.audience ?? [],
    smoking: r.smoking,
    pets: r.pets,
    housemates: r.housemates ?? [],
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
    title: text(d.title).trim(),
    description: text(d.description).trim(),
    city: d.city,
    district: d.district,
    metro_station: d.metro?.station ?? null,
    metro_minutes: d.metro?.minutes ?? null,
    centre: d.centre,
    room_type: d.roomType,
    price: d.price,
    deposit: d.deposit,
    utilities_included: d.utilitiesIncluded,
    spots: d.spots,
    rooms: d.rooms,
    area: d.area,
    floor: d.floor,
    floors: d.floors,
    available_from: d.availableFrom,
    amenities: d.amenities,
    gender: d.gender,
    audience: d.audience,
    smoking: d.smoking,
    pets: d.pets,
    housemates: d.housemates.filter((m) => m.name.trim()),
    photos: d.photos,
    status: d.status === 'blocked' ? 'paused' : d.status,
  };
}
