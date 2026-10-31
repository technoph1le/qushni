-- =====================================================================================================
-- Removes every Qo'shni table, view, function and policy so schema.sql can start clean.
-- !!! Deletes all listings, orders and profiles. Sign-in accounts (auth.users) and uploaded photos
-- !!! stay; schema.sql gives each account its profile back (people verify their phone again).
-- Run reset.sql, then schema.sql, in Supabase → SQL Editor.
-- =====================================================================================================

drop trigger if exists on_auth_user_created on auth.users;

drop view if exists public.public_listings cascade;

drop table if exists
  public.contact_reveals, public.favorites, public.listing_private, public.rate_limits,
  public.click_transactions, public.payme_transactions, public.subscriptions, public.orders, public.plans,
  public.telegram_logins, public.listings, public.profiles, public.app_settings
cascade;

drop function if exists
  public.handle_new_user(), public.touch_updated_at(), public.sync_approx_location(),
  public.phone_verified(uuid), public.has_active_subscription(uuid), public.can_view_contacts(),
  public.my_access(), public.get_listing_location(uuid), public.reveal_listing_contact(uuid),
  public.bump_listing_view(uuid), public.complete_order(bigint), public.cancel_order(bigint, boolean),
  public.hit_rate_limit(text, int, int)
cascade;

drop schema if exists private cascade;

drop policy if exists "upload own listing photos" on storage.objects;
drop policy if exists "update own listing photos" on storage.objects;
drop policy if exists "delete own listing photos" on storage.objects;
