-- Consolidated migration for suggestion_items hardening and favourites support.
-- Safe to re-run.

begin;

-- 1) Ensure favourite flag exists for Item Database favourites.
alter table public.suggestion_items
  add column if not exists favourite boolean not null default false;

-- 2) Add updated_at for better sync/merge tracking.
alter table public.suggestion_items
  add column if not exists updated_at timestamptz not null default now();

-- 3) Optional soft-delete support for suggestion entries.
alter table public.suggestion_items
  add column if not exists deleted_at timestamptz;

-- 4) Prevent duplicate suggestions per household/item name.
create unique index if not exists suggestion_unique_per_household
  on public.suggestion_items(household_id, lower(name));

-- 5) Speed up favourite queries for "Add Favourites".
create index if not exists suggestion_household_favourite_idx
  on public.suggestion_items(household_id, favourite)
  where deleted_at is null;

commit;
