// Demo mode only. With Supabase connected, the switch is `app_settings.paywall_enabled` in the database,
// and the database enforces it. `?paywall=1` previews the locked UI on the dev server.
export const PAYWALL_ENABLED = false;

export interface Plan {
  id: '7d' | '10d' | '30d';
  days: number;
  price: number; // UZS — keep in sync with the `plans` table
  popular?: boolean;
}

export const PLANS: Plan[] = [
  { id: '7d', days: 7, price: 29000 },
  { id: '10d', days: 10, price: 39000 },
  { id: '30d', days: 30, price: 79000, popular: true },
];

/** Shown in the footer, legal pages and support links. Update before launch. */
export const COMPANY = {
  name: 'Mir2Dos',
  product: "Qo'shni",
  city: { uz: 'Toshkent, O‘zbekiston', ru: 'Ташкент, Узбекистан', en: 'Tashkent, Uzbekistan' },
  email: 'support@qoshni.uz',
  telegram: 'qoshni_support', // without @
  website: 'qoshni.uz',
};

/** Date shown on the privacy policy and terms; change it whenever their text changes. */
export const LEGAL_UPDATED = '2026-10-25';
