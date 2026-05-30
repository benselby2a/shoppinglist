-- Remove legacy shopping-list tables from public schema after namespace migration.
-- Safe to run multiple times.

begin;

-- Remove old publication entries if any old public tables still exist.
do $$
begin
  if to_regclass('public.shopping_items') is not null then
    alter publication supabase_realtime drop table public.shopping_items;
  end if;
end $$;

do $$
begin
  if to_regclass('public.meals') is not null then
    alter publication supabase_realtime drop table public.meals;
  end if;
end $$;

do $$
begin
  if to_regclass('public.meal_items') is not null then
    alter publication supabase_realtime drop table public.meal_items;
  end if;
end $$;

-- Drop legacy public tables if they still exist.
drop table if exists public.meal_items cascade;
drop table if exists public.meals cascade;
drop table if exists public.suggestion_items cascade;
drop table if exists public.shopping_items cascade;

commit;
