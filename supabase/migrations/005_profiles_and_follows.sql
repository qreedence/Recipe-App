-- User profiles with public username and visibility toggle
create table public.profiles (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  username    text not null unique,
  is_public   boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint username_format check (username ~ '^[a-z0-9][a-z0-9_-]{1,28}[a-z0-9]$')
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;

create policy "profiles_select_anyone" on public.profiles for select using (true);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = user_id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Follows: user_id follows target_id
create table public.follows (
  user_id     uuid not null references auth.users(id) on delete cascade,
  target_id   uuid not null references auth.users(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (user_id, target_id),
  constraint no_self_follow check (user_id != target_id)
);

alter table public.follows enable row level security;

create policy "follows_select_own" on public.follows for select using (auth.uid() = user_id);
create policy "follows_insert_own" on public.follows for insert with check (auth.uid() = user_id);
create policy "follows_delete_own" on public.follows for delete using (auth.uid() = user_id);

-- Allow reading recipes from public profiles (for /u/{username} pages)
create policy "recipes_select_public" on public.recipes for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.user_id = recipes.user_id
      and profiles.is_public = true
    )
  );
