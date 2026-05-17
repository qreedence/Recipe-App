-- Shared shopping lists
-- Adds shopping_lists, shopping_list_members, shopping_list_invites tables.
-- Migrates shopping_items from per-user ownership to per-list membership.
--
-- Sharing model:
--   * Flat membership: every member can read and edit items in the list.
--   * Only the list creator can rename/delete the list, send invites,
--     or remove other members. Any member can leave the list.
--   * Invites are gated by mutual-follow (both users must follow each other).
--     The mutual-follow check is enforced server-side via RLS, not in the
--     client, so the rule can't be bypassed.
--   * Invites are pending rows. Accepting deletes the invite and inserts a
--     member row; declining just deletes the invite. Re-invites are allowed.

-- ---------------------------------------------------------------------------
-- shopping_lists
-- ---------------------------------------------------------------------------
create table public.shopping_lists (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(trim(name)) between 1 and 80),
  created_by  uuid not null references auth.users(id) on delete cascade,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index shopping_lists_created_by_idx on public.shopping_lists (created_by);

create trigger shopping_lists_set_updated_at
  before update on public.shopping_lists
  for each row execute function public.set_updated_at();

alter table public.shopping_lists enable row level security;

-- ---------------------------------------------------------------------------
-- shopping_list_members
-- ---------------------------------------------------------------------------
create table public.shopping_list_members (
  list_id    uuid not null references public.shopping_lists(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  joined_at  timestamptz not null default now(),
  primary key (list_id, user_id)
);

create index shopping_list_members_user_idx on public.shopping_list_members (user_id);

alter table public.shopping_list_members enable row level security;

-- ---------------------------------------------------------------------------
-- shopping_list_invites
-- ---------------------------------------------------------------------------
create table public.shopping_list_invites (
  id          uuid primary key default gen_random_uuid(),
  list_id     uuid not null references public.shopping_lists(id) on delete cascade,
  invited_by  uuid not null references auth.users(id) on delete cascade,
  invitee_id  uuid not null references auth.users(id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (list_id, invitee_id),
  constraint no_self_invite check (invited_by != invitee_id)
);

create index shopping_list_invites_invitee_idx on public.shopping_list_invites (invitee_id);
create index shopping_list_invites_list_idx    on public.shopping_list_invites (list_id);

alter table public.shopping_list_invites enable row level security;

-- ---------------------------------------------------------------------------
-- Membership helper
-- SECURITY DEFINER lets policies that depend on membership query
-- shopping_list_members without recursing through its own RLS.
-- ---------------------------------------------------------------------------
create or replace function public.is_shopping_list_member(target_list_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.shopping_list_members
    where list_id = target_list_id
      and user_id = auth.uid()
  );
$$;

-- ---------------------------------------------------------------------------
-- RLS: shopping_lists
-- ---------------------------------------------------------------------------
create policy "shopping_lists_select_member" on public.shopping_lists for select
  using (public.is_shopping_list_member(id));

create policy "shopping_lists_insert_self" on public.shopping_lists for insert
  with check (auth.uid() = created_by);

create policy "shopping_lists_update_creator" on public.shopping_lists for update
  using (auth.uid() = created_by) with check (auth.uid() = created_by);

create policy "shopping_lists_delete_creator" on public.shopping_lists for delete
  using (auth.uid() = created_by);

-- ---------------------------------------------------------------------------
-- RLS: shopping_list_members
--   SELECT: any member sees the full membership of the list
--   INSERT: creator bootstrapping themselves, OR creator adding a mutual follow
--   DELETE: creator removes anyone; user removes self (leave list)
-- ---------------------------------------------------------------------------
create policy "shopping_list_members_select_member" on public.shopping_list_members for select
  using (public.is_shopping_list_member(list_id));

create policy "shopping_list_members_insert_creator_or_self" on public.shopping_list_members for insert
  with check (
    (
      auth.uid() = user_id
      and exists (
        select 1 from public.shopping_lists
        where id = shopping_list_members.list_id and created_by = auth.uid()
      )
    )
    or (
      exists (
        select 1 from public.shopping_lists
        where id = shopping_list_members.list_id and created_by = auth.uid()
      )
      and exists (
        select 1 from public.follows
        where user_id = auth.uid() and target_id = shopping_list_members.user_id
      )
      and exists (
        select 1 from public.follows
        where user_id = shopping_list_members.user_id and target_id = auth.uid()
      )
    )
  );

create policy "shopping_list_members_delete_creator_or_self" on public.shopping_list_members for delete
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.shopping_lists
      where id = shopping_list_members.list_id and created_by = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- RLS: shopping_list_invites
--   SELECT: invitee and inviter see the invite
--   INSERT: only list creator, only with mutual-follow invitee, not already a member
--   DELETE: invitee (decline) or inviter (rescind)
-- ---------------------------------------------------------------------------
create policy "shopping_list_invites_select_party" on public.shopping_list_invites for select
  using (auth.uid() = invitee_id or auth.uid() = invited_by);

create policy "shopping_list_invites_insert_creator_mutual" on public.shopping_list_invites for insert
  with check (
    auth.uid() = invited_by
    and exists (
      select 1 from public.shopping_lists
      where id = shopping_list_invites.list_id and created_by = auth.uid()
    )
    and exists (
      select 1 from public.follows
      where user_id = auth.uid() and target_id = shopping_list_invites.invitee_id
    )
    and exists (
      select 1 from public.follows
      where user_id = shopping_list_invites.invitee_id and target_id = auth.uid()
    )
    and not exists (
      select 1 from public.shopping_list_members
      where list_id = shopping_list_invites.list_id
        and user_id = shopping_list_invites.invitee_id
    )
  );

create policy "shopping_list_invites_delete_party" on public.shopping_list_invites for delete
  using (auth.uid() = invitee_id or auth.uid() = invited_by);

-- ---------------------------------------------------------------------------
-- Migrate shopping_items: drop user_id ownership, add list_id membership
-- ---------------------------------------------------------------------------

drop policy if exists "shopping_items_select_own" on public.shopping_items;
drop policy if exists "shopping_items_insert_own" on public.shopping_items;
drop policy if exists "shopping_items_update_own" on public.shopping_items;
drop policy if exists "shopping_items_delete_own" on public.shopping_items;

drop index if exists shopping_items_user_created_idx;
drop index if exists shopping_items_user_checked_idx;

alter table public.shopping_items add column list_id uuid;

-- For every user who owns existing items, create a default list and link
-- their items to it.
do $$
declare
  rec record;
  new_list_id uuid;
begin
  for rec in select distinct user_id from public.shopping_items loop
    insert into public.shopping_lists (name, created_by)
    values ('My Shopping List', rec.user_id)
    returning id into new_list_id;

    insert into public.shopping_list_members (list_id, user_id)
    values (new_list_id, rec.user_id);

    update public.shopping_items
    set list_id = new_list_id
    where user_id = rec.user_id;
  end loop;
end $$;

-- Catch every other existing user (no items yet) so they have a list to write to.
insert into public.shopping_lists (name, created_by)
select 'My Shopping List', u.id
from auth.users u
where not exists (
  select 1 from public.shopping_lists sl where sl.created_by = u.id
);

insert into public.shopping_list_members (list_id, user_id)
select sl.id, sl.created_by
from public.shopping_lists sl
where not exists (
  select 1 from public.shopping_list_members slm
  where slm.list_id = sl.id and slm.user_id = sl.created_by
);

alter table public.shopping_items
  alter column list_id set not null,
  add constraint shopping_items_list_id_fkey
    foreign key (list_id) references public.shopping_lists(id) on delete cascade;

alter table public.shopping_items drop column user_id;

create index shopping_items_list_created_idx on public.shopping_items (list_id, created_at desc);
create index shopping_items_list_checked_idx on public.shopping_items (list_id, checked);

create policy "shopping_items_select_member" on public.shopping_items for select
  using (public.is_shopping_list_member(list_id));

create policy "shopping_items_insert_member" on public.shopping_items for insert
  with check (public.is_shopping_list_member(list_id));

create policy "shopping_items_update_member" on public.shopping_items for update
  using (public.is_shopping_list_member(list_id))
  with check (public.is_shopping_list_member(list_id));

create policy "shopping_items_delete_member" on public.shopping_items for delete
  using (public.is_shopping_list_member(list_id));

-- ---------------------------------------------------------------------------
-- Auto-create a default shopping list on new user signup
-- ---------------------------------------------------------------------------
create or replace function public.create_default_shopping_list_for_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_list_id uuid;
begin
  insert into public.shopping_lists (name, created_by)
  values ('My Shopping List', new.id)
  returning id into new_list_id;

  insert into public.shopping_list_members (list_id, user_id)
  values (new_list_id, new.id);

  return new;
end;
$$;

create trigger create_default_shopping_list_on_signup
  after insert on auth.users
  for each row execute function public.create_default_shopping_list_for_user();
