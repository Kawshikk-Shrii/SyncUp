-- Fix for Google OAuth profile sync and group creation FK errors.
--
-- Run this in the Supabase SQL Editor.
-- This updates public.users only. Do not modify auth.users directly.

alter table public.users
  add column if not exists password text;

alter table public.users
  alter column password drop not null;

alter table public.users
  add column if not exists avatar text;

notify pgrst, 'reload schema';

-- Optional verification.
select
  column_name,
  is_nullable,
  data_type
from information_schema.columns
where table_schema = 'public'
  and table_name = 'users'
  and column_name in ('id', 'name', 'email', 'password', 'avatar')
order by column_name;
