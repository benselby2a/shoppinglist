-- Add Big Shop eligibility flag to Item Database suggestions.
-- Safe to run multiple times.

begin;

alter table public.suggestion_items
  add column if not exists big_shop boolean not null default false;

create index if not exists suggestion_household_big_shop_idx
  on public.suggestion_items(household_id, big_shop)
  where deleted_at is null;

commit;
