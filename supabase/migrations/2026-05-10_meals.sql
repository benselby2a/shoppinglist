-- Add meals and meal_items for reusable shopping bundles.
-- Safe to run multiple times.

begin;

create table if not exists public.meals (
  id uuid primary key default gen_random_uuid(),
  household_id text not null,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists meals_unique_per_household
  on public.meals(household_id, lower(name));

create index if not exists meals_household_updated_idx
  on public.meals(household_id, updated_at desc);

create table if not exists public.meal_items (
  id uuid primary key default gen_random_uuid(),
  meal_id uuid not null references public.meals(id) on delete cascade,
  household_id text not null,
  name text not null,
  section text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists meal_items_meal_sort_idx
  on public.meal_items(meal_id, sort_order, created_at);

create index if not exists meal_items_household_name_idx
  on public.meal_items(household_id, lower(name));

alter table public.meals enable row level security;
alter table public.meal_items enable row level security;

drop policy if exists "household read meals" on public.meals;
create policy "household read meals"
  on public.meals
  for select
  to anon
  using (household_id = 'shared-household');

drop policy if exists "household write meals" on public.meals;
create policy "household write meals"
  on public.meals
  for all
  to anon
  using (household_id = 'shared-household')
  with check (household_id = 'shared-household');

drop policy if exists "household read meal items" on public.meal_items;
create policy "household read meal items"
  on public.meal_items
  for select
  to anon
  using (household_id = 'shared-household');

drop policy if exists "household write meal items" on public.meal_items;
create policy "household write meal items"
  on public.meal_items
  for all
  to anon
  using (household_id = 'shared-household')
  with check (household_id = 'shared-household');

do $$
begin
  alter publication supabase_realtime add table public.meals;
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.meal_items;
exception
  when duplicate_object then null;
end $$;

commit;
