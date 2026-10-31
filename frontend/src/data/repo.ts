import { supabase } from '../lib/supabase';
import { dataUrlToBlob } from '../lib/utils';
import type { Listing, ListingContact, ListingDraft, ListingLocation, ListingStatus } from '../types';
import { draftToRow, LISTING_COLUMNS, publicRowToListing, rowToFields, type Row } from './mappers';

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

export const repo: Repo = supabaseRepo();
