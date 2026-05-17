-- Allow the list creator to SELECT, in addition to members.
--
-- Migration 008's policy only let members read shopping_lists. That blocks
-- the common create flow: the client INSERTs a list, PostgREST runs the
-- implicit SELECT for RETURNING *, but the user isn't a member yet (the
-- members row is inserted in the next call). Result: 403 on every list
-- creation.
--
-- Adding the creator to the read-allowed set is safe — only `auth.uid()`
-- itself can create a row with `created_by = auth.uid()` (enforced by the
-- INSERT policy), so this only widens reads for rows the user already
-- materially owns. In steady state the creator is always also a member.

drop policy "shopping_lists_select_member" on public.shopping_lists;

create policy "shopping_lists_select_member" on public.shopping_lists for select
  using (
    public.is_shopping_list_member(id)
    or auth.uid() = created_by
  );
