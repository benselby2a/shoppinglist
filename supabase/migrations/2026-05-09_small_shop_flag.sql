-- Add small shop flag to shopping items.
-- Safe to run multiple times.

begin;

alter table public.shopping_items
  add column if not exists small_shop boolean not null default false;

create index if not exists shopping_items_household_small_shop_idx
  on public.shopping_items(household_id, small_shop)
  where deleted_at is null;

commit;
