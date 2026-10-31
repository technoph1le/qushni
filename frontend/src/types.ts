export type Lang = 'uz' | 'ru' | 'en';

export type LocalizedText = string | Record<Lang, string>;

export type RoomType = 'private' | 'shared' | 'studio';
export type Gender = 'male' | 'female' | 'any';
export type Audience = 'students' | 'workers' | 'family';
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

export interface Housemate {
  name: string;
  age: number;
  occupation: string;
}

/** Fields everyone can see. Exact address and phone are never part of it. */
export interface ListingFields {
  title: LocalizedText;
  description: LocalizedText;
  city: string;
  district: string;
  metro: { station: string; minutes: number } | null;
  centre: boolean;
  roomType: RoomType;
  price: number; // UZS per person per month
  deposit: number;
  utilitiesIncluded: boolean;
  spots: number;
  rooms: number;
  area: number;
  floor: number;
  floors: number;
  availableFrom: string; // YYYY-MM-DD
  amenities: Amenity[];
  gender: Gender;
  audience: Audience[];
  smoking: boolean;
  pets: boolean;
  housemates: Housemate[];
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
