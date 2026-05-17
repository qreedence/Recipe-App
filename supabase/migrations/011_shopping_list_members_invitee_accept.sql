-- Let invitees insert their own membership row when they accept an invite.
--
-- Migration 008's policy had two INSERT branches: creator-bootstrap and
-- creator-adds-a-mutual. Neither lets the *invitee* self-add — but the
-- accept flow is invitee-driven: client inserts (list_id, self) and then
-- deletes the pending invite. Without a third branch, every accept gets
-- a 403.
--
-- Branch 3 below allows self-insert when a pending invite already exists
-- for the user on that list. The pending invite stands in for re-checking
-- mutual-follow at accept time: the inviter could only have created the
-- invite if mutual-follow held then. If a follow breaks between invite
-- and accept, the invitee can still join — judged acceptable for the
-- shopping-list use case.

drop policy "shopping_list_members_insert_creator_or_self" on public.shopping_list_members;

create policy "shopping_list_members_insert_creator_or_invitee"
on public.shopping_list_members for insert
with check (
  -- Creator self-bootstrap when first creating the list.
  (
    auth.uid() = user_id
    and exists (
      select 1 from public.shopping_lists
      where id = shopping_list_members.list_id
        and created_by = auth.uid()
    )
  )
  -- Creator directly adds a mutual (currently unused by the client, kept
  -- as a "direct add" affordance for future flows).
  or (
    exists (
      select 1 from public.shopping_lists
      where id = shopping_list_members.list_id
        and created_by = auth.uid()
    )
    and exists (
      select 1 from public.follows
      where user_id = auth.uid()
        and target_id = shopping_list_members.user_id
    )
    and exists (
      select 1 from public.follows
      where user_id = shopping_list_members.user_id
        and target_id = auth.uid()
    )
  )
  -- Invitee accepts an existing invite (self-insert).
  or (
    auth.uid() = user_id
    and exists (
      select 1 from public.shopping_list_invites
      where list_id = shopping_list_members.list_id
        and invitee_id = auth.uid()
    )
  )
);
