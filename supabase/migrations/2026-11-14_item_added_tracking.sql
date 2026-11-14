-- Record when and by whom each shopping item was added, shown in the item's "..." menu.
-- Items added before this migration keep these columns null (the app says so).
-- Safe to re-run.

alter table shopping_list.shopping_items
  add column if not exists added_at timestamptz,
  add column if not exists added_by text;
