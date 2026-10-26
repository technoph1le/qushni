import { PAYWALL_ENABLED } from '../config';
import { DEMO, supabase } from '../lib/supabase';
import { getState, setState, type DemoListing } from '../lib/store';
import type { Listing, ListingContact, ListingDraft, ListingLocation, ListingStatus } from '../types';
import { approxPoint, dataUrlToBlob } from '../lib/utils';
import { SEED_LISTINGS, type SeedListing } from './demoListings';

export class SubscriptionRequired extends Error {
  constructor() {
    super('subscription_required');
  }
}

export interface Access {
  paywall: boolean;
  accessUntil: string | null;
}

export interface Repo {
  listListings(): Promise<Listing[]>;
  getListing(id: string): Promise<Listing | null>;
  myListings(userId: string): Promise<Listing[]>;
  getDraft(id: string): Promise<ListingDraft | null>;
  saveListing(userId: string, draft: ListingDraft): Promise<string>;
  deleteListing(id: string): Promise<void>;
  setStatus(id: string, status: ListingStatus): Promise<void>;
  getLocation(id: string): Promise<ListingLocation | null>;
  revealContact(id: string): Promise<ListingContact>;
  bumpView(id: string): Promise<void>;
  getAccess(): Promise<Access>;
}

// ------------------------------------------------------------------ Supabase

const LISTING_COLUMNS =
  'id, title, description, city, district, metro_station, metro_minutes, centre, room_type, price, deposit, ' +
  'utilities_included, spots, rooms, area, floor, floors, available_from, amenities, gender, audience, smoking, ' +
  'pets, housemates, photos, status';

type Row = Record<string, any>;

function rowToFields(r: Row) {
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

function publicRowToListing(r: Row): Listing {
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

function draftToRow(d: ListingDraft) {
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

function ok<T>(res: { data: T; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data;
}

async function uploadPhotos(userId: string, photos: string[]): Promise<string[]> {
  const sb = supabase!;
  return Promise.all(
    photos.map(async (p) => {
      if (!p.startsWith('data:')) return p;
      const path = `${userId}/${crypto.randomUUID()}.jpg`;
      ok(await sb.storage.from('listing-photos').upload(path, dataUrlToBlob(p), { contentType: 'image/jpeg' }));
      return sb.storage.from('listing-photos').getPublicUrl(path).data.publicUrl;
    }),
  );
}

const supabaseRepo = (): Repo => {
  const sb = supabase!;
  return {
    async listListings() {
      const rows = ok(await sb.from('public_listings').select('*').order('created_at', { ascending: false }).limit(500));
      return (rows ?? []).map(publicRowToListing);
    },
    async getListing(id) {
      const pub = ok(await sb.from('public_listings').select('*').eq('id', id).maybeSingle());
      if (pub) return publicRowToListing(pub);
      // A paused listing is visible to its owner only.
      const own = ok(await sb.from('listings').select(`${LISTING_COLUMNS}, approx_lat, approx_lng, views, contacts, created_at`).eq('id', id).maybeSingle()) as Row | null;
      if (!own) return null;
      return publicRowToListing({ ...own, host_name: '', host_verified: false, host_since: own.created_at, host_has_telegram: false });
    },
    async myListings(userId) {
      const rows = ok(
        await sb
          .from('listings')
          .select(`${LISTING_COLUMNS}, approx_lat, approx_lng, views, contacts, created_at`)
          .eq('owner_id', userId)
          .order('created_at', { ascending: false }),
      ) as Row[];
      return rows.map((r) =>
        publicRowToListing({ ...r, host_name: '', host_verified: false, host_since: r.created_at, host_has_telegram: false }),
      );
    },
    async getDraft(id) {
      const r = ok(await sb.from('listings').select(`${LISTING_COLUMNS}, listing_private(address, lat, lng)`).eq('id', id).maybeSingle()) as Row | null;
      if (!r) return null;
      const priv = Array.isArray(r.listing_private) ? r.listing_private[0] : r.listing_private;
      return { id: r.id, ...rowToFields(r), address: priv?.address ?? '', lat: priv?.lat ?? 0, lng: priv?.lng ?? 0 };
    },
    async saveListing(userId, draft) {
      const photos = await uploadPhotos(userId, draft.photos);
      const row = { ...draftToRow(draft), photos };
      let id = draft.id;
      if (id) {
        ok(await sb.from('listings').update(row).eq('id', id));
      } else {
        const created = ok(await sb.from('listings').insert({ ...row, owner_id: userId }).select('id').single()) as { id: string };
        id = created.id;
      }
      ok(await sb.from('listing_private').upsert({ listing_id: id, address: draft.address.trim(), lat: draft.lat, lng: draft.lng }));
      return id;
    },
    async deleteListing(id) {
      ok(await sb.from('listings').delete().eq('id', id));
    },
    async setStatus(id, status) {
      ok(await sb.from('listings').update({ status }).eq('id', id));
    },
    async getLocation(id) {
      const rows = ok(await sb.rpc('get_listing_location', { p_listing: id })) as ListingLocation[] | null;
      return rows?.[0] ?? null;
    },
    async revealContact(id) {
      const res = await sb.rpc('reveal_listing_contact', { p_listing: id });
      if (res.error) {
        if (res.error.message.includes('subscription_required')) throw new SubscriptionRequired();
        throw new Error(res.error.message);
      }
      const row = (res.data as ListingContact[])[0];
      return { phone: row?.phone ?? '', telegram: row?.telegram ?? null };
    },
    async bumpView(id) {
      await sb.rpc('bump_listing_view', { p_listing: id });
    },
    async getAccess() {
      const rows = ok(await sb.rpc('my_access')) as { paywall_enabled: boolean; access_until: string | null }[];
      return { paywall: rows[0]?.paywall_enabled ?? false, accessUntil: rows[0]?.access_until ?? null };
    },
  };
};

// ------------------------------------------------------------------ Demo (localStorage)

function seedToListing(s: SeedListing): Listing {
  const { address: _a, lat, lng, host, ...rest } = s;
  const p = approxPoint(s.id, lat, lng);
  return { ...rest, approxLat: p.lat, approxLng: p.lng, host: { name: host.name, verified: host.verified, since: host.since, hasTelegram: !!host.telegram } };
}

function demoToListing(d: DemoListing): Listing {
  const { address: _a, lat, lng, ...rest } = d;
  const user = getState().demoUser;
  const p = approxPoint(d.id, lat, lng);
  const c = getState().demoCounters[d.id] ?? { views: 0, contacts: 0 };
  return {
    ...rest,
    approxLat: p.lat,
    approxLng: p.lng,
    host: { name: user?.name ?? '—', verified: false, since: d.createdAt.slice(0, 7), hasTelegram: false },
    views: c.views,
    contacts: c.contacts,
  };
}

function withCounters(l: Listing): Listing {
  const c = getState().demoCounters[l.id];
  return c && !l.id.startsWith('my-') ? { ...l, views: l.views + c.views, contacts: l.contacts + c.contacts } : l;
}

function bump(id: string, field: 'views' | 'contacts') {
  setState((s) => {
    const cur = s.demoCounters[id] ?? { views: 0, contacts: 0 };
    return { demoCounters: { ...s.demoCounters, [id]: { ...cur, [field]: cur[field] + 1 } } };
  });
}

const demoAccess = (): Access => {
  const until = getState().demoAccessUntil;
  return { paywall: PAYWALL_ENABLED, accessUntil: until && new Date(until) > new Date() ? until : null };
};

const canViewDemo = () => {
  const a = demoAccess();
  return !(a.paywall || getState().paywallPreview) || a.accessUntil !== null;
};

const demoRepo: Repo = {
  async listListings() {
    const mine = getState().demoListings.filter((l) => l.status === 'active').map(demoToListing);
    return [...mine, ...SEED_LISTINGS.map(seedToListing).map(withCounters)];
  },
  async getListing(id) {
    const mine = getState().demoListings.find((l) => l.id === id);
    if (mine) return demoToListing(mine);
    const seed = SEED_LISTINGS.find((l) => l.id === id);
    return seed ? withCounters(seedToListing(seed)) : null;
  },
  async myListings() {
    return getState().demoListings.map(demoToListing);
  },
  async getDraft(id) {
    return getState().demoListings.find((l) => l.id === id) ?? null;
  },
  async saveListing(_userId, draft) {
    const id = draft.id ?? `my-${Date.now().toString(36)}`;
    setState((s) => {
      const existing = s.demoListings.find((l) => l.id === id);
      const next: DemoListing = { ...draft, id, createdAt: existing?.createdAt ?? new Date().toISOString().slice(0, 10) };
      return { demoListings: existing ? s.demoListings.map((l) => (l.id === id ? next : l)) : [next, ...s.demoListings] };
    });
    return id;
  },
  async deleteListing(id) {
    setState((s) => ({ demoListings: s.demoListings.filter((l) => l.id !== id) }));
  },
  async setStatus(id, status) {
    setState((s) => ({ demoListings: s.demoListings.map((l) => (l.id === id ? { ...l, status } : l)) }));
  },
  async getLocation(id) {
    const mine = getState().demoListings.find((l) => l.id === id);
    if (mine) return { address: mine.address, lat: mine.lat, lng: mine.lng };
    if (!canViewDemo()) return null;
    const seed = SEED_LISTINGS.find((l) => l.id === id);
    return seed ? { address: seed.address, lat: seed.lat, lng: seed.lng } : null;
  },
  async revealContact(id) {
    const mine = getState().demoListings.find((l) => l.id === id);
    if (mine) return { phone: getState().demoUser?.phone ?? '', telegram: null };
    if (!canViewDemo()) throw new SubscriptionRequired();
    const seed = SEED_LISTINGS.find((l) => l.id === id);
    bump(id, 'contacts');
    return { phone: seed?.host.phone ?? '', telegram: seed?.host.telegram ?? null };
  },
  async bumpView(id) {
    bump(id, 'views');
  },
  async getAccess() {
    return demoAccess();
  },
};

export const repo: Repo = DEMO ? demoRepo : supabaseRepo();
