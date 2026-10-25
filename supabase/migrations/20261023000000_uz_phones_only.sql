-- Only Uzbek (+998) phone numbers can be stored, whatever the client or backend sends.
alter table public.profiles
  add constraint profiles_phone_uz check (phone is null or phone ~ '^\+998[0-9]{9}$');

alter table public.telegram_logins
  add constraint telegram_logins_phone_uz check (phone ~ '^\+998[0-9]{9}$');
