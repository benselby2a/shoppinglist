-- Big shop / small shop mode, shared across every device on the household list.
--
-- list_settings holds one row per household (id = household_id). shop_mode is
-- 'big' (show everything) or 'small' (show only items flagged small_shop).
-- Items added during a small shop get small_shop = true; the column already
-- exists from 2026-05-09_small_shop_flag.sql, re-asserted here for safety.
-- Safe to re-run.

begin;

alter table shopping_list.shopping_items
  add column if not exists small_shop boolean not null default false;

create table if not exists shopping_list.list_settings (
  id text primary key,
  household_id text not null,
  shop_mode text not null default 'big' check (shop_mode in ('big', 'small')),
  updated_at timestamptz not null default now(),
  updated_by text
);

alter table shopping_list.list_settings enable row level security;

drop policy if exists "household read settings" on shopping_list.list_settings;
create policy "household read settings" on shopping_list.list_settings
  for select to authenticated using (household_id = 'shared-household');

drop policy if exists "household write settings" on shopping_list.list_settings;
create policy "household write settings" on shopping_list.list_settings
  for all to authenticated
  using (household_id = 'shared-household')
  with check (household_id = 'shared-household');

grant select, insert, update, delete on shopping_list.list_settings to authenticated;

commit;
