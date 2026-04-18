-- Recipebook: initial schema for Supabase migration
-- Apply via Supabase Dashboard → SQL Editor, or CLI: supabase db push
--
-- Design notes:
--   * IDs are client-generated UUIDs for recipes/shopping_items (matches current Dexie behavior);
--     meal_plan_entries uses a server-generated UUID with a natural unique key on (user_id, date, meal_type).
--   * All nested data (ingredients, steps, tags, macros) stored as JSONB — no joins needed for current
--     access patterns (query by tag, title, favorite). Can normalize to separate tables later if needed.
--   * recipe_drafts table intentionally NOT included — drafts are ephemeral local form state, not user data
--     worth syncing across devices.
--   * images stored as base64 text (unchanged from Dexie). Follow-up: migrate to Supabase Storage.
--   * meal_plan_entries.recipe_id is uuid but NOT a foreign key — entries hold a denormalized recipe
--     snapshot that should survive recipe deletion (matches current Dexie behavior).

-- ---------------------------------------------------------------------------
-- Trigger helper: auto-update updated_at on any row modification
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- recipes
-- ---------------------------------------------------------------------------
create table public.recipes (
  id          uuid primary key,
  user_id     uuid not null references auth.users(id) on delete cascade,
  title       text not null,
  portions    integer not null default 1,
  is_favorite boolean not null default false,
  ingredients jsonb not null default '[]'::jsonb,
  steps       jsonb not null default '[]'::jsonb,
  image       text,
  macros      jsonb not null default '{"kcal":0,"carbs":0,"fat":0,"protein":0}'::jsonb,
  macro_mode  text not null default 'auto' check (macro_mode in ('auto', 'manual')),
  tags        jsonb not null default '[]'::jsonb,
  rating      integer check (rating is null or rating between 1 and 5),
  created_at  bigint not null,
  updated_at  timestamptz not null default now()
);

create index recipes_user_created_idx  on public.recipes (user_id, created_at desc);
create index recipes_user_favorite_idx on public.recipes (user_id) where is_favorite;
create index recipes_tags_gin_idx      on public.recipes using gin (tags);

create trigger recipes_set_updated_at
  before update on public.recipes
  for each row execute function public.set_updated_at();

alter table public.recipes enable row level security;

create policy "recipes_select_own" on public.recipes for select using (auth.uid() = user_id);
create policy "recipes_insert_own" on public.recipes for insert with check (auth.uid() = user_id);
create policy "recipes_update_own" on public.recipes for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "recipes_delete_own" on public.recipes for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- shopping_items
-- ---------------------------------------------------------------------------
create table public.shopping_items (
  id           uuid primary key,
  user_id      uuid not null references auth.users(id) on delete cascade,
  name         text not null,
  amount       text not null default '',
  checked      boolean not null default false,
  category     text,
  recipe_id    uuid references public.recipes(id) on delete set null,
  recipe_title text,
  created_at   bigint not null,
  updated_at   timestamptz not null default now()
);

create index shopping_items_user_created_idx on public.shopping_items (user_id, created_at desc);
create index shopping_items_user_checked_idx on public.shopping_items (user_id, checked);
create index shopping_items_recipe_id_idx    on public.shopping_items (recipe_id) where recipe_id is not null;

create trigger shopping_items_set_updated_at
  before update on public.shopping_items
  for each row execute function public.set_updated_at();

alter table public.shopping_items enable row level security;

create policy "shopping_items_select_own" on public.shopping_items for select using (auth.uid() = user_id);
create policy "shopping_items_insert_own" on public.shopping_items for insert with check (auth.uid() = user_id);
create policy "shopping_items_update_own" on public.shopping_items for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "shopping_items_delete_own" on public.shopping_items for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- meal_plan_entries
-- ---------------------------------------------------------------------------
create table public.meal_plan_entries (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  date          date not null,
  meal_type     text not null check (meal_type in ('Breakfast', 'Brunch', 'Lunch', 'Dinner', 'Snack')),
  recipe_id     uuid not null,
  recipe_title  text not null,
  recipe_macros jsonb not null,
  recipe_image  text,
  updated_at    timestamptz not null default now(),
  unique (user_id, date, meal_type)
);

create index meal_plan_entries_user_date_idx on public.meal_plan_entries (user_id, date);

create trigger meal_plan_entries_set_updated_at
  before update on public.meal_plan_entries
  for each row execute function public.set_updated_at();

alter table public.meal_plan_entries enable row level security;

create policy "meal_plan_entries_select_own" on public.meal_plan_entries for select using (auth.uid() = user_id);
create policy "meal_plan_entries_insert_own" on public.meal_plan_entries for insert with check (auth.uid() = user_id);
create policy "meal_plan_entries_update_own" on public.meal_plan_entries for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "meal_plan_entries_delete_own" on public.meal_plan_entries for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- meal_type_config (per-user, per-weekday enabled meal types)
-- ---------------------------------------------------------------------------
create table public.meal_type_config (
  user_id       uuid not null references auth.users(id) on delete cascade,
  weekday       smallint not null check (weekday between 0 and 6),
  enabled_types jsonb not null default '[]'::jsonb,
  updated_at    timestamptz not null default now(),
  primary key (user_id, weekday)
);

create trigger meal_type_config_set_updated_at
  before update on public.meal_type_config
  for each row execute function public.set_updated_at();

alter table public.meal_type_config enable row level security;

create policy "meal_type_config_select_own" on public.meal_type_config for select using (auth.uid() = user_id);
create policy "meal_type_config_insert_own" on public.meal_type_config for insert with check (auth.uid() = user_id);
create policy "meal_type_config_update_own" on public.meal_type_config for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "meal_type_config_delete_own" on public.meal_type_config for delete using (auth.uid() = user_id);
