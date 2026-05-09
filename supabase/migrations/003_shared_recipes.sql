-- Shared recipes: stores a snapshot of a recipe for link-based sharing.
-- Anyone with the token can read; only the owner can create/delete.

create table public.shared_recipes (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid not null references auth.users(id) on delete cascade,
  recipe_snapshot jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.shared_recipes enable row level security;

create policy "shared_recipes_select_anyone" on public.shared_recipes for select using (true);
create policy "shared_recipes_insert_own" on public.shared_recipes for insert with check (auth.uid() = owner_id);
create policy "shared_recipes_delete_own" on public.shared_recipes for delete using (auth.uid() = owner_id);
