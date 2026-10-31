export type Lang = 'uz' | 'ru' | 'en';

export type LocalizedText = string | Record<Lang, string>;

export type RoomType = 'private' | 'shared' | 'studio';
export type Gender = 'male' | 'female' | 'any';
export type ListingStatus = 'active' | 'paused' | 'blocked';

export type Amenity =
  | 'metro'
  | 'bus'
  | 'wifi'
  | 'washer'
  | 'ac'
  | 'heating'
  | 'furniture'
  | 'kitchen'
  | 'fridge'
  | 'parking'
  | 'elevator'
  | 'balcony'
  | 'tv'
  | 'security';

/** Fields everyone can see. Exact address and phone are never part of it. Only price is required from the host. */
export interface ListingFields {
  /** Optional; the site shows the room type when it's empty (see listingTitle). */
  title: LocalizedText;
  description: LocalizedText;
  city: string;
  district: string;
  metro: string | null; // nearest station, in cities that have a metro
  roomType: RoomType;
  price: number; // UZS per person per month
  utilitiesIncluded: boolean;
  spots: number;
  amenities: Amenity[];
  gender: Gender;
  /** Region the people living here are from (REGIONS id), so visitors can find compatriots. */
  origin: string | null;
  photos: string[];
  status: ListingStatus;
}

export interface Listing extends ListingFields {
  id: string;
  approxLat: number;
  approxLng: number;
  host: { name: string; verified: boolean; since: string; hasTelegram: boolean };
  createdAt: string;
  views: number;
  contacts: number;
}

export interface ListingLocation {
  address: string;
  lat: number;
  lng: number;
}

export interface ListingContact {
  phone: string;
  telegram: string | null;
}

/** What the host edits: public fields plus the private location. */
export interface ListingDraft extends ListingFields, ListingLocation {
  id: string | null;
}
