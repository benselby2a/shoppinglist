-- Require a signed-in Supabase user for all shopping-list data access.
--
-- Every policy created so far granted access "to anon" (and
-- 2026-05-23_move_tables_to_shopping_list_schema.sql additionally granted
-- anon raw select/insert/update/delete on the whole schema). The only gate
-- was household_id = 'shared-household' -- a fixed, non-secret string that
-- ships in the public client bundle. In practice that meant anyone holding
-- the (necessarily public) anon key and project URL could read or write the
-- entire household's data over the REST API with no sign-in at all.
--
-- This migration switches every policy to "to authenticated" and revokes
-- anon's access to the schema entirely. Safe to re-run.

begin;

drop policy if exists "household read items" on shopping_list.shopping_items;
drop policy if exists "household write items" on shopping_list.shopping_items;
create policy "household read items"
  on shopping_list.shopping_items
  for select
  to authenticated
  using (household_id = 'shared-household');
create policy "household write items"
  on shopping_list.shopping_items
  for all
  to authenticated
  using (household_id = 'shared-household')
  with check (household_id = 'shared-household');

drop policy if exists "household read suggestions" on shopping_list.suggestion_items;
drop policy if exists "household write suggestions" on shopping_list.suggestion_items;
create policy "household read suggestions"
  on shopping_list.suggestion_items
  for select
  to authenticated
  using (household_id = 'shared-household');
create policy "household write suggestions"
  on shopping_list.suggestion_items
  for all
  to authenticated
  using (household_id = 'shared-household')
  with check (household_id = 'shared-household');

drop policy if exists "household read meals" on shopping_list.meals;
drop policy if exists "household write meals" on shopping_list.meals;
create policy "household read meals"
  on shopping_list.meals
  for select
  to authenticated
  using (household_id = 'shared-household');
create policy "household write meals"
  on shopping_list.meals
  for all
  to authenticated
  using (household_id = 'shared-household')
  with check (household_id = 'shared-household');

drop policy if exists "household read meal items" on shopping_list.meal_items;
drop policy if exists "household write meal items" on shopping_list.meal_items;
create policy "household read meal items"
  on shopping_list.meal_items
  for select
  to authenticated
  using (household_id = 'shared-household');
create policy "household write meal items"
  on shopping_list.meal_items
  for all
  to authenticated
  using (household_id = 'shared-household')
  with check (household_id = 'shared-household');

-- anon no longer needs (and must not have) any access to this schema.
revoke select, insert, update, delete on all tables in schema shopping_list from anon;
revoke usage on schema shopping_list from anon;

commit;
