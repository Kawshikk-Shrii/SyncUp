-- Fix for Supabase OAuth error:
-- "Database error saving new user"
--
-- Run this in the Supabase SQL Editor if Google sign-in fails before a
-- session is created. It removes the common auth.users trigger that often
-- breaks when the public.users schema changes. SyncUp creates/updates the
-- public.users profile after sign-in through POST /auth/sync, so this trigger
-- is not required by the app.

drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

-- Optional: check whether any custom auth.users triggers still exist.
select
  trigger_name,
  event_manipulation,
  action_statement
from information_schema.triggers
where event_object_schema = 'auth'
  and event_object_table = 'users'
order by trigger_name;
