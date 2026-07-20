-- 010_photo_media_hub_password_auth.sql
-- Swap the SMS-code flow for plain email + password.  Passwords are stored as
-- scrypt hashes — no external SMS provider required.

alter table public.photo_contributors
  add column if not exists password_hash text,
  add column if not exists is_approved   boolean not null default true;

alter table public.photo_contributors alter column mobile drop not null;

create unique index if not exists photo_contributors_email_uidx
  on public.photo_contributors (lower(email))
  where email is not null;

drop table if exists public.photo_login_codes;
