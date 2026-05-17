// Shopping list invites: cloud-only.
//
// RLS already gates everything: invitee + inviter can SELECT their own
// invites, only the list creator (with mutual-follow to the invitee) can
// INSERT, either party can DELETE. We don't queue these for offline drain
// — invites are interactive moments; if the user is offline the action
// just fails and they retry.

import { createClient } from '@/lib/supabase/client'
import { getCurrentUserId } from '@/lib/supabase/session'
import type { ShoppingListInvite } from '@/lib/types'

interface InviteRow {
  id: string
  list_id: string
  invited_by: string
  invitee_id: string
  created_at: string
  shopping_lists: { name: string } | null
}

async function joinProfilesOntoInvites(rows: InviteRow[]): Promise<ShoppingListInvite[]> {
  if (rows.length === 0) return []

  const userIds = Array.from(new Set(rows.flatMap((r) => [r.invited_by, r.invitee_id])))
  const supabase = createClient()
  const { data: profiles } = await supabase
    .from('profiles')
    .select('user_id, username, avatar_url')
    .in('user_id', userIds)

  const profileMap = new Map<string, { username: string; avatarUrl: string | null }>()
  for (const p of profiles ?? []) {
    profileMap.set(p.user_id, {
      username: p.username,
      avatarUrl: p.avatar_url ?? null,
    })
  }

  return rows.map((row) => {
    const inviter = profileMap.get(row.invited_by)
    const invitee = profileMap.get(row.invitee_id)
    return {
      id: row.id,
      listId: row.list_id,
      listName: row.shopping_lists?.name ?? '',
      invitedBy: row.invited_by,
      inviterUsername: inviter?.username ?? '',
      inviterAvatarUrl: inviter?.avatarUrl ?? null,
      inviteeId: row.invitee_id,
      inviteeUsername: invitee?.username ?? '',
      createdAt: row.created_at,
    }
  })
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

export async function getIncomingInvites(): Promise<ShoppingListInvite[]> {
  const userId = getCurrentUserId()
  if (!userId) return []

  const supabase = createClient()
  const { data, error } = await supabase
    .from('shopping_list_invites')
    .select('*, shopping_lists(name)')
    .eq('invitee_id', userId)
    .order('created_at', { ascending: false })
  if (error || !data) return []

  return joinProfilesOntoInvites(data as InviteRow[])
}

export async function getOutgoingInvitesForList(
  listId: string,
): Promise<ShoppingListInvite[]> {
  const userId = getCurrentUserId()
  if (!userId) return []

  const supabase = createClient()
  const { data, error } = await supabase
    .from('shopping_list_invites')
    .select('*, shopping_lists(name)')
    .eq('list_id', listId)
    .eq('invited_by', userId)
    .order('created_at', { ascending: false })
  if (error || !data) return []

  return joinProfilesOntoInvites(data as InviteRow[])
}

// ---------------------------------------------------------------------------
// Writes
// ---------------------------------------------------------------------------

export async function sendInvite(listId: string, inviteeId: string): Promise<boolean> {
  const userId = getCurrentUserId()
  if (!userId) return false

  const supabase = createClient()
  const { error } = await supabase
    .from('shopping_list_invites')
    .insert({ list_id: listId, invited_by: userId, invitee_id: inviteeId })
  return !error
}

export async function acceptInvite(inviteId: string, listId: string): Promise<boolean> {
  const userId = getCurrentUserId()
  if (!userId) return false

  const supabase = createClient()

  // Insert membership first. If it fails (e.g., the mutual-follow broke
  // between send and accept), we surface the failure and leave the invite
  // so the user can retry or decline.
  const { error: memberError } = await supabase
    .from('shopping_list_members')
    .insert({ list_id: listId, user_id: userId })
  if (memberError) return false

  // Membership is the authoritative state. The invite is now redundant;
  // if this DELETE fails we accept the cosmetic leftover — they can dismiss
  // it later.
  await supabase.from('shopping_list_invites').delete().eq('id', inviteId)
  return true
}

export async function declineInvite(inviteId: string): Promise<boolean> {
  const supabase = createClient()
  const { error } = await supabase
    .from('shopping_list_invites')
    .delete()
    .eq('id', inviteId)
  return !error
}

export async function rescindInvite(inviteId: string): Promise<boolean> {
  const supabase = createClient()
  const { error } = await supabase
    .from('shopping_list_invites')
    .delete()
    .eq('id', inviteId)
  return !error
}
