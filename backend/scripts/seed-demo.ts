// Fills the database with sample rooms for demos (run in backend/):
//   npm run demo:seed     adds 6 demo hosts and 24 rooms; running it again replaces them, nothing doubles
//   npm run demo:remove   deletes the demo hosts and all their rooms
// Uses SUPABASE_URL and the secret key from backend/.env, so it writes to whichever project that points at.
// Demo hosts are ordinary accounts with emails like qushni-demo-dilnoza@example.com and fake +998 00… phones.
// The rooms themselves are in demo-data.ts.
import { createClient } from '@supabase/supabase-js';
import { HOSTS, LISTINGS, PHOTOS } from './demo-data.js';

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set (in backend/.env).');
  process.exit(1);
}
const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

const email = (hostKey: string) => `qushni-demo-${hostKey}@example.com`;
const ago = (ms: number) => new Date(Date.now() - ms).toISOString();
const DAY = 86_400_000;

async function demoUsers() {
  const found = new Map<string, string>(); // email → user id
  for (let page = 1; ; page++) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    for (const u of data.users) if (u.email?.startsWith('qushni-demo-')) found.set(u.email, u.id);
    if (data.users.length < 1000) return found;
  }
}

async function remove() {
  const users = await demoUsers();
  for (const [mail, id] of users) {
    const { error } = await db.auth.admin.deleteUser(id); // profiles and listings go with it (on delete cascade)
    if (error) throw error;
    console.log(`removed ${mail}`);
  }
  console.log(users.size ? `Done: ${users.size} demo hosts and their rooms removed.` : 'No demo data found.');
}

async function seed() {
  const existing = await demoUsers();
  const ids = new Map<string, string>(); // host key → user id

  for (const [i, h] of HOSTS.entries()) {
    let id = existing.get(email(h.key));
    if (!id) {
      const { data, error } = await db.auth.admin.createUser({
        email: email(h.key),
        email_confirm: true,
        user_metadata: { full_name: h.name, demo: true },
      });
      if (error) throw error;
      id = data.user.id;
    }
    ids.set(h.key, id);
    const { error } = await db
      .from('profiles')
      .upsert({
        id,
        full_name: h.name,
        phone: `+99800000000${i + 1}`,
        phone_verified: true,
        identity_verified: h.verified,
        created_at: ago(h.monthsAgo * 30 * DAY),
      });
    if (error) throw error;
  }

  const owners = [...ids.values()];
  const del = await db.from('listings').delete().in('owner_id', owners);
  if (del.error) throw del.error;

  const rows = LISTINGS.map((l, i) => ({
    owner_id: ids.get(l.host)!,
    status: 'active',
    city: l.city,
    district: l.district,
    address: l.address,
    lat: l.lat,
    lng: l.lng,
    metro_station: l.metro ?? null,
    room_type: l.roomType,
    price: l.price,
    spots: l.spots,
    gender: l.gender,
    origin: l.origin,
    utilities_included: l.utilities,
    amenities: l.amenities,
    title: l.title,
    description: l.description,
    photos: l.photos.map((p) => PHOTOS[p]),
    views: l.views,
    contacts: l.contacts,
    // Spread across the day too, so the newest-first order is stable and looks natural.
    created_at: ago(l.daysAgo * DAY + (i % 7) * 3_600_000),
  }));
  const { error } = await db.from('listings').insert(rows);
  if (error) throw error;

  const cities = new Set(LISTINGS.map((l) => l.city)).size;
  console.log(`Done: ${HOSTS.length} demo hosts, ${rows.length} rooms in ${cities} cities.`);
}

await (process.argv.includes('--remove') ? remove() : seed()).catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});
