-- Move shopping list tables into dedicated schema namespace.
-- Safe to run multiple times.

begin;

create schema if not exists shopping_list;

-- Ensure API roles can access schema + objects.
grant usage on schema shopping_list to anon, authenticated, service_role;

-- Move tables from public -> shopping_list (if still in public).
do $$
begin
  if to_regclass('public.shopping_items') is not null then
    alter table public.shopping_items set schema shopping_list;
  end if;
end $$;

do $$
begin
  if to_regclass('public.suggestion_items') is not null then
    alter table public.suggestion_items set schema shopping_list;
  end if;
end $$;

do $$
begin
  if to_regclass('public.meals') is not null then
    alter table public.meals set schema shopping_list;
  end if;
end $$;

do $$
begin
  if to_regclass('public.meal_items') is not null then
    alter table public.meal_items set schema shopping_list;
  end if;
end $$;

-- Keep realtime publication aligned to namespaced tables.
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

do $$
begin
  alter publication supabase_realtime add table shopping_list.shopping_items;
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table shopping_list.meals;
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table shopping_list.meal_items;
exception
  when duplicate_object then null;
end $$;

-- Ensure table privileges exist after move.
grant select, insert, update, delete on all tables in schema shopping_list to anon, authenticated, service_role;

commit;
