-- Fix for Supabase Google OAuth profile sync error:
-- "Could not find the 'avatar' column of 'users' in the schema cache"
--
-- Run this in the Supabase SQL Editor.
-- This updates public.users only. Do not modify auth.users directly.

alter table public.users
  add column if not exists avatar text;

-- Refresh PostgREST's schema cache so Supabase REST immediately sees the column.
notify pgrst, 'reload schema';

-- Optional verification: this should return one row for public.users.avatar.
select
  table_schema,
  table_name,
  column_name,
  data_type
from information_schema.columns
where table_schema = 'public'
  and table_name = 'users'
  and column_name = 'avatar';
