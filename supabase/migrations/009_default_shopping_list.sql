-- Default shopping list per user
--
-- Adds a pointer on profiles to the user's currently-active shopping list.
-- Backfilled from each user's first shopping_lists row (created by migration
-- 008's backfill or signup trigger). Nullable, so users without a profile row
-- yet or users whose default list was deleted still work — the sync layer
-- falls back to "first list I created" when this is NULL.

alter table public.profiles
  add column default_shopping_list_id uuid
    references public.shopping_lists(id) on delete set null;

update public.profiles p
set default_shopping_list_id = (
  select id
  from public.shopping_lists
  where created_by = p.user_id
  order by created_at asc
  limit 1
);
