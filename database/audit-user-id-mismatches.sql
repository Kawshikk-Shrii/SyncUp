-- Audit and repair plan for public.users rows whose ID does not match auth.users.id.
--
-- Run the SELECT first. Do not run the repair template until you have reviewed
-- each mismatched user and replaced the placeholder values.
--
-- Main rule:
-- public.users.id must be exactly equal to auth.users.id for the same email.

-- 1) Detect mismatches.
select
  au.id as auth_user_id,
  au.email as auth_email,
  pu.id as public_user_id,
  pu.email as public_email,
  pu.name,
  pu.avatar
from auth.users au
join public.users pu
  on lower(au.email) = lower(pu.email)
where au.id <> pu.id
order by au.email;

-- 2) Check dependent rows before repairing one user.
-- Replace the two UUID placeholders before running.
/*
select 'groups.created_by' as dependency, count(*) from public.groups where created_by = 'WRONG_PUBLIC_USER_ID'
union all
select 'group_members.user_id', count(*) from public.group_members where user_id = 'WRONG_PUBLIC_USER_ID'
union all
select 'availability.user_id', count(*) from public.availability where user_id = 'WRONG_PUBLIC_USER_ID'
union all
select 'group_member_locations.user_id', count(*) from public.group_member_locations where user_id = 'WRONG_PUBLIC_USER_ID'
union all
select 'group_messages.user_id', count(*) from public.group_messages where user_id = 'WRONG_PUBLIC_USER_ID';
*/

-- 3) Repair one reviewed mismatch.
-- Replace all placeholders. Run one user at a time.
/*
begin;

update public.groups
set created_by = 'CORRECT_AUTH_USER_ID'
where created_by = 'WRONG_PUBLIC_USER_ID';

update public.group_members
set user_id = 'CORRECT_AUTH_USER_ID'
where user_id = 'WRONG_PUBLIC_USER_ID';

update public.availability
set user_id = 'CORRECT_AUTH_USER_ID'
where user_id = 'WRONG_PUBLIC_USER_ID';

update public.group_member_locations
set user_id = 'CORRECT_AUTH_USER_ID'
where user_id = 'WRONG_PUBLIC_USER_ID';

update public.group_messages
set user_id = 'CORRECT_AUTH_USER_ID'
where user_id = 'WRONG_PUBLIC_USER_ID';

delete from public.users
where id = 'WRONG_PUBLIC_USER_ID';

insert into public.users (
  id,
  name,
  email,
  password,
  avatar
)
values (
  'CORRECT_AUTH_USER_ID',
  'USER_NAME',
  'USER_EMAIL',
  null,
  'USER_AVATAR_OR_NULL'
)
on conflict (id) do update set
  name = excluded.name,
  email = excluded.email,
  password = null,
  avatar = excluded.avatar;

commit;

notify pgrst, 'reload schema';
*/

-- 4) Optional RLS policy checklist.
-- If RLS is enabled, authenticated users need policies equivalent to:
-- - public.users: select profiles, insert own row where auth.uid() = id, update own row where auth.uid() = id
-- - public.groups: insert where auth.uid() = created_by
-- - public.group_members: insert where auth.uid() = user_id
