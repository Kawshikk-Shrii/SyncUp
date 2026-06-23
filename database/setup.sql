-- =============================================
-- SyncUp Supabase Migration
-- Run this in the Supabase SQL Editor
-- =============================================

create extension if not exists "pgcrypto";

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  email text unique,
  password text,
  avatar text,
  created_at timestamptz not null default now()
);

alter table public.users
  add column if not exists password text,
  add column if not exists avatar text;

alter table public.users
  alter column password drop not null;

create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  unique (group_id, user_id)
);

create table if not exists public.group_member_locations (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  latitude double precision,
  longitude double precision,
  location_text text,
  location_source text check (location_source in ('gps', 'manual')),
  updated_at timestamptz not null default now(),
  unique (group_id, user_id)
);

create table if not exists public.availability (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  group_id uuid not null references public.groups(id) on delete cascade,
  date date not null,
  from_date date,
  to_date date,
  start_time time not null,
  end_time time not null,
  created_at timestamptz not null default now(),
  unique (user_id, group_id, date),
  check (start_time < end_time)
);

create table if not exists public.group_messages (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  message text not null,
  created_at timestamptz not null default now()
);

alter table public.group_messages
  add column if not exists group_id uuid references public.groups(id) on delete cascade,
  add column if not exists user_id uuid references public.users(id) on delete cascade,
  add column if not exists message text,
  add column if not exists created_at timestamptz not null default now();

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'group_messages'
      and column_name = 'content'
  ) then
    update public.group_messages
    set message = content
    where message is null and content is not null;
  end if;
end $$;

alter table public.group_messages
  alter column message set not null;

do $$
begin
  alter table public.availability
    add column if not exists from_date date,
    add column if not exists to_date date;

  update public.availability
  set
    from_date = coalesce(from_date, date),
    to_date = coalesce(to_date, date)
  where from_date is null or to_date is null;

  alter table public.availability
    alter column from_date set not null,
    alter column to_date set not null;

  if exists (
    select 1
    from pg_constraint
    where conname = 'availability_user_id_group_id_date_key'
      and conrelid = 'public.availability'::regclass
  ) then
    alter table public.availability
      drop constraint availability_user_id_group_id_date_key;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'availability_user_group_range_slot_unique'
      and conrelid = 'public.availability'::regclass
  ) then
    alter table public.availability
      add constraint availability_user_group_range_slot_unique
      unique (user_id, group_id, from_date, to_date, start_time, end_time);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'availability_from_to_date_check'
      and conrelid = 'public.availability'::regclass
  ) then
    alter table public.availability
      add constraint availability_from_to_date_check
      check (from_date <= to_date);
  end if;
end $$;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'group_messages'
      and column_name = 'content'
  ) then
    alter table public.group_messages drop column content;
  end if;
end $$;

alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.group_member_locations enable row level security;
alter table public.availability enable row level security;
alter table public.group_messages enable row level security;

drop policy if exists "Members can view their groups" on public.groups;
create policy "Members can view their groups"
  on public.groups
  for select
  using (
    id in (
      select gm.group_id
      from public.group_members gm
      where gm.user_id = auth.uid()
    )
  );

drop policy if exists "Users can create groups" on public.groups;
create policy "Users can create groups"
  on public.groups
  for insert
  with check (auth.uid() is not null);

drop policy if exists "Members can view group memberships" on public.group_members;
create policy "Members can view group memberships"
  on public.group_members
  for select
  using (
    group_id in (
      select gm.group_id
      from public.group_members gm
      where gm.user_id = auth.uid()
    )
  );

drop policy if exists "Users can join groups" on public.group_members;
create policy "Users can join groups"
  on public.group_members
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Members can view group member locations" on public.group_member_locations;
create policy "Members can view group member locations"
  on public.group_member_locations
  for select
  using (
    group_id in (
      select gm.group_id
      from public.group_members gm
      where gm.user_id = auth.uid()
    )
  );

drop policy if exists "Users can add their group location" on public.group_member_locations;
create policy "Users can add their group location"
  on public.group_member_locations
  for insert
  with check (
    auth.uid() = user_id
    and group_id in (
      select gm.group_id
      from public.group_members gm
      where gm.user_id = auth.uid()
    )
  );

drop policy if exists "Users can update their group location" on public.group_member_locations;
create policy "Users can update their group location"
  on public.group_member_locations
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Members can view group availability" on public.availability;
create policy "Members can view group availability"
  on public.availability
  for select
  using (
    group_id in (
      select gm.group_id
      from public.group_members gm
      where gm.user_id = auth.uid()
    )
  );

drop policy if exists "Users can add their availability" on public.availability;
create policy "Users can add their availability"
  on public.availability
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their availability" on public.availability;
create policy "Users can update their availability"
  on public.availability
  for update
  using (auth.uid() = user_id);

drop policy if exists "Users can delete their availability" on public.availability;
create policy "Users can delete their availability"
  on public.availability
  for delete
  using (auth.uid() = user_id);

drop policy if exists "Members can view group messages" on public.group_messages;
create policy "Members can view group messages"
  on public.group_messages
  for select
  using (
    group_id in (
      select gm.group_id
      from public.group_members gm
      where gm.user_id = auth.uid()
    )
  );

drop policy if exists "Members can send group messages" on public.group_messages;
create policy "Members can send group messages"
  on public.group_messages
  for insert
  with check (
    auth.uid() = user_id
    and group_id in (
      select gm.group_id
      from public.group_members gm
      where gm.user_id = auth.uid()
    )
  );

create index if not exists idx_group_members_group_id on public.group_members(group_id);
create index if not exists idx_group_members_user_id on public.group_members(user_id);
create index if not exists idx_group_member_locations_group_id on public.group_member_locations(group_id);
create index if not exists idx_group_member_locations_user_id on public.group_member_locations(user_id);
create index if not exists idx_availability_group_id_date on public.availability(group_id, date);
create index if not exists idx_availability_group_id_from_to_date on public.availability(group_id, from_date, to_date);
create index if not exists idx_group_messages_group_id_created_at on public.group_messages(group_id, created_at);

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'group_messages'
  ) then
    alter publication supabase_realtime add table public.group_messages;
  end if;
end $$;
