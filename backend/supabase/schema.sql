-- =====================================================================================================
-- Qo'shni database. Run in Supabase → SQL Editor on an empty project, or after reset.sql.
--
-- What's public (shown in Table Editor):
--   profiles      one row per account (name, phone, Telegram)
--   listings      rooms people posted; exact address/point are never readable by other users
--   plans, orders, subscriptions, payme_transactions, click_transactions   paid access to contacts
--   telegram_logins   short-lived phone sign-in requests from the Telegram bot
--   contact_reveals   who opened a listing's phone number (abuse checks)
--   app_settings      one row: is the paywall on?
-- Helper functions live in the "private" schema, which the API doesn't expose.
-- =====================================================================================================

create extension if not exists pgcrypto;
create schema if not exists private;
grant usage on schema private to anon, authenticated, service_role;

-- -------------------------------------------------------------------------------- settings
create table public.app_settings (
  id boolean primary key default true check (id),
  paywall_enabled boolean not null default false
);
comment on table public.app_settings is 'Single row. paywall_enabled = true makes phone numbers and exact addresses paid.';
insert into public.app_settings default values;
alter table public.app_settings enable row level security;
create policy "anyone reads settings" on public.app_settings for select using (true);

-- -------------------------------------------------------------------------------- profiles
create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  full_name text not null default '',
  avatar_url text,
  phone text unique check (phone is null or phone ~ '^\+998[0-9]{9}$'),
  phone_verified boolean not null default false,
  telegram_id bigint unique,
  telegram_username text,
  identity_verified boolean not null default false,
  created_at timestamptz not null default now()
);
comment on table public.profiles is 'One per account. Phone and Telegram fields are written only by the backend after the bot confirms them.';
alter table public.profiles enable row level security;
create policy "read own profile" on public.profiles for select to authenticated using (id = auth.uid());
create policy "update own profile" on public.profiles for update to authenticated using (id = auth.uid());
revoke insert, update, delete on public.profiles from anon, authenticated;
grant update (full_name, avatar_url) on public.profiles to authenticated;

create function private.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', ''),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

-- Accounts that already exist (e.g. after reset.sql) get their profile back.
insert into public.profiles (id, full_name, avatar_url)
select u.id,
       coalesce(u.raw_user_meta_data ->> 'full_name', u.raw_user_meta_data ->> 'name', ''),
       u.raw_user_meta_data ->> 'avatar_url'
  from auth.users u
on conflict (id) do nothing;

create function private.phone_verified(uid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce((select phone_verified from public.profiles where id = uid), false);
$$;

-- -------------------------------------------------------------------------------- listings
-- Only price is required from the host; everything else has a sensible default.
create table public.listings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles on delete cascade,
  status text not null default 'active' check (status in ('active', 'paused', 'blocked')),

  -- where
  city text not null,
  district text not null default 'markaz',
  address text not null default '' check (char_length(address) <= 300),   -- private
  lat double precision not null check (lat between -90 and 90),           -- private, exact
  lng double precision not null check (lng between -180 and 180),         -- private, exact
  approx_lat double precision,   -- public, 300–500 m off, set by trigger
  approx_lng double precision,
  metro_station text,

  -- the room
  room_type text not null default 'private' check (room_type in ('private', 'shared', 'studio')),
  price int not null check (price > 0),   -- so'm per person per month
  spots int not null default 1 check (spots between 1 and 20),
  gender text not null default 'any' check (gender in ('male', 'female', 'any')),
  origin text check (origin in (           -- region the people living here are from (see REGIONS in the frontend)
    'tashkent-city', 'tashkent', 'andijan', 'bukhara', 'fergana', 'jizzakh', 'khorezm', 'namangan',
    'navoi', 'kashkadarya', 'karakalpakstan', 'samarkand', 'syrdarya', 'surkhandarya'
  )),
  utilities_included boolean not null default false,
  amenities text[] not null default '{}' check (amenities <@ array[
    'wifi', 'washer', 'ac', 'heating', 'furniture', 'kitchen', 'fridge', 'parking',
    'elevator', 'balcony', 'tv', 'security', 'metro', 'bus'
  ]),
  title text not null default '' check (char_length(title) <= 120),   -- optional; the site shows the room type if empty
  description text not null default '' check (char_length(description) <= 4000),
  photos text[] not null default '{}' check (cardinality(photos) <= 8),

  views int not null default 0,
  contacts int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.listings is 'Rooms. Other users read them through the public_listings view, which hides address, lat and lng.';
create index listings_browse_idx on public.listings (status, city, origin, created_at desc);
create index listings_owner_idx on public.listings (owner_id);

-- Keeps updated_at current and derives the public approximate point from the exact one:
-- a stable 300–500 m offset based on the listing id.
create function private.listings_before_write() returns trigger
language plpgsql set search_path = '' as $$
declare
  h bigint := abs(hashtext(new.id::text)::bigint);
  angle double precision := radians(h % 360);
  dist double precision := 0.003 + ((h / 360) % 100) / 100.0 * 0.002;
begin
  new.updated_at := now();
  new.approx_lat := new.lat + sin(angle) * dist;
  new.approx_lng := new.lng + cos(angle) * dist * 1.3;
  return new;
end $$;

create trigger listings_before_write before insert or update on public.listings
  for each row execute function private.listings_before_write();

alter table public.listings enable row level security;
create policy "owners read own listings" on public.listings for select to authenticated
  using (owner_id = auth.uid());
create policy "verified users create listings" on public.listings for insert to authenticated
  with check (owner_id = auth.uid() and private.phone_verified(auth.uid()) and status in ('active', 'paused'));
create policy "owners update own listings" on public.listings for update to authenticated
  using (owner_id = auth.uid() and status <> 'blocked')
  with check (owner_id = auth.uid() and status in ('active', 'paused'));
create policy "owners delete own listings" on public.listings for delete to authenticated
  using (owner_id = auth.uid());

-- Counters, moderation and the computed point are not client-writable: hosts may write only these columns.
revoke insert, update on public.listings from anon, authenticated;
grant insert (owner_id, status, city, district, address, lat, lng, metro_station, room_type, price, spots, gender,
  origin, utilities_included, amenities, title, description, photos) on public.listings to authenticated;
grant update (status, city, district, address, lat, lng, metro_station, room_type, price, spots, gender,
  origin, utilities_included, amenities, title, description, photos) on public.listings to authenticated;

-- The public catalogue: no address, no exact point, no phone.
create view public.public_listings as
select
  l.id, l.city, l.district, l.approx_lat, l.approx_lng, l.metro_station,
  l.room_type, l.price, l.spots, l.gender, l.origin, l.utilities_included, l.amenities,
  l.title, l.description, l.photos, l.views, l.contacts, l.created_at,
  p.full_name as host_name,
  p.identity_verified as host_verified,
  p.created_at as host_since,
  (p.telegram_username is not null) as host_has_telegram
from public.listings l
join public.profiles p on p.id = l.owner_id
where l.status = 'active';
comment on view public.public_listings is 'What visitors see. Address, exact point and phone come only through get_listing_location / reveal_listing_contact.';
grant select on public.public_listings to anon, authenticated;

-- -------------------------------------------------------------------------------- paid access
create table public.plans (
  id text primary key,
  days int not null check (days > 0),
  price int not null check (price > 0),   -- so'm
  active boolean not null default true,
  sort int not null default 0
);
comment on table public.plans is 'What a seeker can buy to see phone numbers while the paywall is on.';
insert into public.plans (id, days, price, sort) values
  ('7d', 7, 29000, 1),
  ('10d', 10, 39000, 2),
  ('30d', 30, 79000, 3);
alter table public.plans enable row level security;
create policy "anyone reads active plans" on public.plans for select using (active);

create table public.orders (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles on delete cascade,
  plan_id text not null references public.plans,
  amount int not null,   -- so'm
  provider text not null check (provider in ('payme', 'click')),
  status text not null default 'pending' check (status in ('pending', 'paid', 'cancelled', 'refunded')),
  created_at timestamptz not null default now(),
  paid_at timestamptz,
  cancelled_at timestamptz
);
comment on table public.orders is 'One per checkout. Created and settled by the backend.';
create index orders_user_idx on public.orders (user_id);
alter table public.orders enable row level security;
create policy "read own orders" on public.orders for select to authenticated using (user_id = auth.uid());

create table public.subscriptions (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles on delete cascade,
  order_id bigint not null unique references public.orders,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  revoked boolean not null default false
);
comment on table public.subscriptions is 'Paid access periods. A new purchase starts when the previous one ends.';
create index subscriptions_user_idx on public.subscriptions (user_id, ends_at);
alter table public.subscriptions enable row level security;
create policy "read own subscriptions" on public.subscriptions for select to authenticated using (user_id = auth.uid());

create table public.payme_transactions (
  id text primary key,
  internal_id bigint generated always as identity unique,
  order_id bigint not null references public.orders,
  amount bigint not null,   -- tiyin
  state smallint not null,
  reason smallint,
  payme_time bigint not null,   -- ms, as Payme sends them
  create_time bigint not null,
  perform_time bigint not null default 0,
  cancel_time bigint not null default 0
);
comment on table public.payme_transactions is 'Payme protocol log. Backend only.';
create index payme_order_idx on public.payme_transactions (order_id);
alter table public.payme_transactions enable row level security;

create table public.click_transactions (
  click_trans_id bigint primary key,
  order_id bigint not null references public.orders,
  amount numeric not null,
  status text not null check (status in ('prepared', 'completed', 'cancelled')),
  created_at timestamptz not null default now()
);
comment on table public.click_transactions is 'Click protocol log. Backend only.';
alter table public.click_transactions enable row level security;

-- -------------------------------------------------------------------------------- Telegram sign-in
create table public.telegram_logins (
  token text primary key,
  phone text not null check (phone ~ '^\+998[0-9]{9}$'),
  user_id uuid references public.profiles on delete cascade,   -- set when linking a phone to an existing account
  lang text not null default 'uz',
  telegram_id bigint,
  telegram_username text,
  first_name text,
  code_hash text,
  attempts int not null default 0,
  status text not null default 'pending' check (status in ('pending', 'code_sent', 'consumed')),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '10 minutes'
);
comment on table public.telegram_logins is 'Sign-in requests: the bot confirms the phone and sends a code. Expire after 10 minutes. Backend only.';
create index telegram_logins_phone_idx on public.telegram_logins (phone, created_at desc);
create index telegram_logins_tg_idx on public.telegram_logins (telegram_id, created_at desc);
alter table public.telegram_logins enable row level security;

-- -------------------------------------------------------------------------------- contact reveals
create table public.contact_reveals (
  id bigint generated always as identity primary key,
  listing_id uuid not null references public.listings on delete cascade,
  viewer_id uuid references public.profiles on delete set null,
  created_at timestamptz not null default now()
);
comment on table public.contact_reveals is 'Each time someone opens a host''s phone number.';
alter table public.contact_reveals enable row level security;

-- -------------------------------------------------------------------------------- access rules
create function private.can_view_contacts() returns boolean
language sql stable security definer set search_path = '' as $$
  select not (select paywall_enabled from public.app_settings)
      or exists (select 1 from public.subscriptions s
                  where s.user_id = auth.uid() and not s.revoked and s.ends_at > now());
$$;

-- Called by the website ----------------------------------------------------------

create function public.my_access()
returns table (paywall_enabled boolean, access_until timestamptz)
language sql stable security definer set search_path = '' as $$
  select
    (select a.paywall_enabled from public.app_settings a),
    (select max(s.ends_at) from public.subscriptions s
      where s.user_id = auth.uid() and not s.revoked and s.ends_at > now());
$$;

create function public.get_listing_location(p_listing uuid)
returns table (address text, lat double precision, lng double precision)
language sql stable security definer set search_path = '' as $$
  select l.address, l.lat, l.lng
    from public.listings l
   where l.id = p_listing
     and (l.owner_id = auth.uid() or (l.status = 'active' and private.can_view_contacts()));
$$;

create function public.reveal_listing_contact(p_listing uuid)
returns table (phone text, telegram text)
language plpgsql security definer set search_path = '' as $$
declare
  v_owner uuid;
begin
  select l.owner_id into v_owner from public.listings l where l.id = p_listing and l.status = 'active';
  if v_owner is null then
    raise exception 'listing_not_found';
  end if;
  if v_owner <> coalesce(auth.uid(), '00000000-0000-0000-0000-000000000000') then
    if not private.can_view_contacts() then
      raise exception 'subscription_required';
    end if;
    insert into public.contact_reveals (listing_id, viewer_id) values (p_listing, auth.uid());
    update public.listings set contacts = contacts + 1 where id = p_listing;
  end if;
  return query select p.phone, p.telegram_username from public.profiles p where p.id = v_owner;
end $$;

create function public.bump_listing_view(p_listing uuid) returns void
language sql security definer set search_path = '' as $$
  update public.listings set views = views + 1 where id = p_listing and status = 'active';
$$;

-- Called by the backend's payment code only ----------------------------------------

create function public.complete_order(p_order bigint) returns void
language plpgsql security definer set search_path = '' as $$
declare
  o public.orders;
  v_days int;
  v_start timestamptz;
begin
  select * into o from public.orders where id = p_order for update;
  if o.id is null then raise exception 'order_not_found'; end if;
  if o.status = 'paid' then return; end if;
  if o.status <> 'pending' then raise exception 'order_not_payable'; end if;

  select days into v_days from public.plans where id = o.plan_id;
  select greatest(now(), coalesce(max(ends_at), now())) into v_start
    from public.subscriptions where user_id = o.user_id and not revoked;

  update public.orders set status = 'paid', paid_at = now() where id = p_order;
  insert into public.subscriptions (user_id, order_id, starts_at, ends_at)
  values (o.user_id, o.id, v_start, v_start + make_interval(days => v_days));
end $$;

create function public.cancel_order(p_order bigint, p_refund boolean) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if p_refund then
    update public.orders set status = 'refunded', cancelled_at = now() where id = p_order and status = 'paid';
    update public.subscriptions set revoked = true where order_id = p_order;
  else
    update public.orders set status = 'cancelled', cancelled_at = now() where id = p_order and status = 'pending';
  end if;
end $$;

-- Functions are executable by everyone by default; lock down the ones that must not be.
revoke execute on all functions in schema private from public;
grant execute on function private.phone_verified(uuid) to authenticated;
grant execute on function private.can_view_contacts() to anon, authenticated;
revoke execute on function public.complete_order(bigint) from public, anon, authenticated;
revoke execute on function public.cancel_order(bigint, boolean) from public, anon, authenticated;
grant execute on function public.complete_order(bigint) to service_role;
grant execute on function public.cancel_order(bigint, boolean) to service_role;

-- -------------------------------------------------------------------------------- photo storage
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('listing-photos', 'listing-photos', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

-- Each user writes only inside their own folder: listing-photos/<user id>/...
create policy "upload own listing photos" on storage.objects for insert to authenticated
  with check (bucket_id = 'listing-photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "update own listing photos" on storage.objects for update to authenticated
  using (bucket_id = 'listing-photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "delete own listing photos" on storage.objects for delete to authenticated
  using (bucket_id = 'listing-photos' and (storage.foldername(name))[1] = auth.uid()::text);
