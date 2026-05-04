create extension if not exists "pgcrypto";

create table if not exists public.shopping_items (
  id uuid primary key default gen_random_uuid(),
  household_id text not null,
  name text not null,
  section text not null,
  quantity_text text,
  checked boolean not null default false,
  deleted_at timestamptz,
  updated_at timestamptz not null default now(),
  updated_by text
);

create index if not exists shopping_items_household_idx on public.shopping_items(household_id);
create index if not exists shopping_items_updated_idx on public.shopping_items(updated_at desc);

create table if not exists public.suggestion_items (
  id uuid primary key default gen_random_uuid(),
  household_id text not null,
  name text not null,
  section text,
  favourite boolean not null default false,
  use_count integer not null default 1,
  last_used_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.suggestion_items
  add column if not exists favourite boolean not null default false;

create unique index if not exists suggestion_unique_per_household
  on public.suggestion_items(household_id, lower(name));

alter table public.shopping_items enable row level security;
alter table public.suggestion_items enable row level security;

drop policy if exists "household read items" on public.shopping_items;
create policy "household read items"
  on public.shopping_items
  for select
  to anon
  using (household_id = 'shared-household');

drop policy if exists "household write items" on public.shopping_items;
create policy "household write items"
  on public.shopping_items
  for all
  to anon
  using (household_id = 'shared-household')
  with check (household_id = 'shared-household');

drop policy if exists "household read suggestions" on public.suggestion_items;
create policy "household read suggestions"
  on public.suggestion_items
  for select
  to anon
  using (household_id = 'shared-household');

drop policy if exists "household write suggestions" on public.suggestion_items;
create policy "household write suggestions"
  on public.suggestion_items
  for all
  to anon
  using (household_id = 'shared-household')
  with check (household_id = 'shared-household');

do $$
begin
  alter publication supabase_realtime add table public.shopping_items;
exception
  when duplicate_object then null;
end $$;
