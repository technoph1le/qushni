-- Qo'shni initial schema.
-- Exact address, coordinates and host phone are never readable from tables directly:
-- they come only through get_listing_location / reveal_listing_contact, which enforce the paywall.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------- settings
create table public.app_settings (
  id boolean primary key default true check (id),
  paywall_enabled boolean not null default false
);
insert into public.app_settings default values;

alter table public.app_settings enable row level security;
create policy "settings are public" on public.app_settings for select using (true);

-- ---------------------------------------------------------------- profiles
create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  full_name text not null default '',
  avatar_url text,
  phone text unique,
  phone_verified boolean not null default false,
  telegram_id bigint unique,
  telegram_username text,
  identity_verified boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
create policy "read own profile" on public.profiles for select to authenticated using (id = auth.uid());
create policy "update own profile" on public.profiles for update to authenticated using (id = auth.uid());
-- Phone, Telegram and verification flags are written only by the backend (service role).
revoke insert, update, delete on public.profiles from anon, authenticated;
grant update (full_name, avatar_url) on public.profiles to authenticated;

create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', ''),
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------- listings
create table public.listings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles on delete cascade,
  title text not null check (char_length(title) between 5 and 120),
  description text not null default '' check (char_length(description) <= 4000),
  city text not null,
  district text not null,
  approx_lat double precision,
  approx_lng double precision,
  metro_station text,
  metro_minutes int check (metro_minutes between 1 and 120),
  centre boolean not null default false,
  room_type text not null check (room_type in ('private', 'shared', 'studio')),
  price int not null check (price > 0),
  deposit int not null default 0 check (deposit >= 0),
  utilities_included boolean not null default false,
  spots int not null default 1 check (spots between 1 and 20),
  rooms int not null default 1 check (rooms between 1 and 20),
  area int not null default 0 check (area >= 0),
  floor int not null default 1,
  floors int not null default 1,
  available_from date not null default current_date,
  amenities text[] not null default '{}' check (amenities <@ array[
    'wifi', 'washer', 'ac', 'heating', 'furniture', 'kitchen', 'fridge', 'parking',
    'elevator', 'balcony', 'tv', 'security', 'metro', 'bus'
  ]),
  gender text not null default 'any' check (gender in ('male', 'female', 'any')),
  audience text[] not null default '{students}' check (audience <@ array['students', 'workers', 'family']),
  smoking boolean not null default false,
  pets boolean not null default false,
  housemates jsonb not null default '[]' check (jsonb_typeof(housemates) = 'array'),
  photos text[] not null default '{}' check (cardinality(photos) <= 8),
  status text not null default 'active' check (status in ('active', 'paused', 'blocked')),
  views int not null default 0,
  contacts int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index listings_browse_idx on public.listings (status, city, district, price);
create index listings_owner_idx on public.listings (owner_id);

create table public.listing_private (
  listing_id uuid primary key references public.listings on delete cascade,
  address text not null check (char_length(address) between 3 and 300),
  lat double precision not null check (lat between -90 and 90),
  lng double precision not null check (lng between -180 and 180)
);

create function public.touch_updated_at() returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

create trigger listings_touch before update on public.listings
  for each row execute function public.touch_updated_at();

-- Approximate point: a stable 300–500 m offset derived from the listing id.
create function public.sync_approx_location() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  h bigint := abs(hashtext(new.listing_id::text)::bigint);
  angle double precision := radians(h % 360);
  dist double precision := 0.003 + ((h / 360) % 100) / 100.0 * 0.002;
begin
  update public.listings
     set approx_lat = new.lat + sin(angle) * dist,
         approx_lng = new.lng + cos(angle) * dist * 1.3
   where id = new.listing_id;
  return new;
end $$;

create trigger listing_private_sync after insert or update on public.listing_private
  for each row execute function public.sync_approx_location();

alter table public.listings enable row level security;
alter table public.listing_private enable row level security;

create function public.phone_verified(uid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce((select phone_verified from public.profiles where id = uid), false);
$$;

create policy "owners read own listings" on public.listings for select to authenticated
  using (owner_id = auth.uid());
create policy "verified users create listings" on public.listings for insert to authenticated
  with check (owner_id = auth.uid() and public.phone_verified(auth.uid()) and status in ('active', 'paused'));
create policy "owners update own listings" on public.listings for update to authenticated
  using (owner_id = auth.uid() and status <> 'blocked')
  with check (owner_id = auth.uid() and status in ('active', 'paused'));
create policy "owners delete own listings" on public.listings for delete to authenticated
  using (owner_id = auth.uid());

-- Counters and moderation status are not client-writable.
revoke insert, update on public.listings from anon, authenticated;
grant insert (owner_id, title, description, city, district, metro_station, metro_minutes, centre, room_type,
  price, deposit, utilities_included, spots, rooms, area, floor, floors, available_from, amenities, gender,
  audience, smoking, pets, housemates, photos, status) on public.listings to authenticated;
grant update (title, description, city, district, metro_station, metro_minutes, centre, room_type,
  price, deposit, utilities_included, spots, rooms, area, floor, floors, available_from, amenities, gender,
  audience, smoking, pets, housemates, photos, status) on public.listings to authenticated;

create policy "owners manage private data" on public.listing_private for all to authenticated
  using (exists (select 1 from public.listings l where l.id = listing_id and l.owner_id = auth.uid()))
  with check (exists (select 1 from public.listings l where l.id = listing_id and l.owner_id = auth.uid()));

-- Public catalogue: no address, no exact point, no phone.
create view public.public_listings as
select
  l.id, l.title, l.description, l.city, l.district, l.approx_lat, l.approx_lng,
  l.metro_station, l.metro_minutes, l.centre, l.room_type, l.price, l.deposit, l.utilities_included,
  l.spots, l.rooms, l.area, l.floor, l.floors, l.available_from, l.amenities, l.gender, l.audience,
  l.smoking, l.pets, l.housemates, l.photos, l.views, l.contacts, l.created_at,
  p.full_name as host_name,
  p.identity_verified as host_verified,
  p.created_at as host_since,
  (p.telegram_username is not null) as host_has_telegram
from public.listings l
join public.profiles p on p.id = l.owner_id
where l.status = 'active' and l.approx_lat is not null;

grant select on public.public_listings to anon, authenticated;

-- ---------------------------------------------------------------- favorites
create table public.favorites (
  user_id uuid not null references public.profiles on delete cascade,
  listing_id uuid not null references public.listings on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, listing_id)
);
alter table public.favorites enable row level security;
create policy "own favorites" on public.favorites for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------------------------------------------------------------- plans, orders, subscriptions
create table public.plans (
  id text primary key,
  days int not null check (days > 0),
  price int not null check (price > 0), -- so'm
  active boolean not null default true,
  sort int not null default 0
);
insert into public.plans (id, days, price, sort) values
  ('7d', 7, 29000, 1),
  ('10d', 10, 39000, 2),
  ('30d', 30, 79000, 3);

alter table public.plans enable row level security;
create policy "plans are public" on public.plans for select using (active);

create table public.orders (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles on delete cascade,
  plan_id text not null references public.plans,
  amount int not null, -- so'm
  provider text not null check (provider in ('payme', 'click')),
  status text not null default 'pending' check (status in ('pending', 'paid', 'cancelled', 'refunded')),
  created_at timestamptz not null default now(),
  paid_at timestamptz,
  cancelled_at timestamptz
);
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
create index subscriptions_user_idx on public.subscriptions (user_id, ends_at);
alter table public.subscriptions enable row level security;
create policy "read own subscriptions" on public.subscriptions for select to authenticated using (user_id = auth.uid());

-- Payme transaction log (amounts in tiyin, times in ms as Payme expects).
create table public.payme_transactions (
  id text primary key,
  internal_id bigint generated always as identity unique,
  order_id bigint not null references public.orders,
  amount bigint not null,
  state smallint not null,
  reason smallint,
  payme_time bigint not null,
  create_time bigint not null,
  perform_time bigint not null default 0,
  cancel_time bigint not null default 0
);
create index payme_order_idx on public.payme_transactions (order_id);
alter table public.payme_transactions enable row level security;

create table public.click_transactions (
  click_trans_id bigint primary key,
  order_id bigint not null references public.orders,
  amount numeric not null,
  status text not null check (status in ('prepared', 'completed', 'cancelled')),
  created_at timestamptz not null default now()
);
alter table public.click_transactions enable row level security;

-- ---------------------------------------------------------------- Telegram phone login
create table public.telegram_logins (
  token text primary key,
  phone text not null,
  user_id uuid references public.profiles on delete cascade, -- set when linking a phone to an existing account
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
create index telegram_logins_phone_idx on public.telegram_logins (phone, created_at desc);
create index telegram_logins_tg_idx on public.telegram_logins (telegram_id, created_at desc);
alter table public.telegram_logins enable row level security;

-- ---------------------------------------------------------------- contact reveals
create table public.contact_reveals (
  id bigint generated always as identity primary key,
  listing_id uuid not null references public.listings on delete cascade,
  viewer_id uuid references public.profiles on delete set null,
  created_at timestamptz not null default now()
);
alter table public.contact_reveals enable row level security;

-- ---------------------------------------------------------------- access functions
create function public.has_active_subscription(uid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select uid is not null and exists (
    select 1 from public.subscriptions s
     where s.user_id = uid and not s.revoked and s.ends_at > now()
  );
$$;

create function public.can_view_contacts() returns boolean
language sql stable security definer set search_path = '' as $$
  select not (select paywall_enabled from public.app_settings)
      or public.has_active_subscription(auth.uid());
$$;

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
  select lp.address, lp.lat, lp.lng
    from public.listing_private lp
    join public.listings l on l.id = lp.listing_id
   where lp.listing_id = p_listing
     and (l.owner_id = auth.uid() or (l.status = 'active' and public.can_view_contacts()));
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
    if not public.can_view_contacts() then
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

-- Called only by the payments backend.
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

revoke execute on function public.complete_order(bigint) from public, anon, authenticated;
revoke execute on function public.cancel_order(bigint, boolean) from public, anon, authenticated;
grant execute on function public.complete_order(bigint) to service_role;
grant execute on function public.cancel_order(bigint, boolean) to service_role;

-- ---------------------------------------------------------------- storage
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('listing-photos', 'listing-photos', true, 5242880, array['image/jpeg', 'image/png', 'image/webp']);

create policy "upload own listing photos" on storage.objects for insert to authenticated
  with check (bucket_id = 'listing-photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "update own listing photos" on storage.objects for update to authenticated
  using (bucket_id = 'listing-photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "delete own listing photos" on storage.objects for delete to authenticated
  using (bucket_id = 'listing-photos' and (storage.foldername(name))[1] = auth.uid()::text);
