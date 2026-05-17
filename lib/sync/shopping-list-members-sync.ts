// Shopping list members: cloud-only.
//
// RLS gates membership reads to other members of the same list. Removes are
// allowed for the creator (any user_id) or for self (leave). All operations
// fail loudly to the UI if the user is offline; we don't queue them.

import { createClient } from '@/lib/supabase/client'
import { getCurrentUserId } from '@/lib/supabase/session'
import type { ShoppingListMember } from '@/lib/types'

export async function getMembersForList(listId: string): Promise<ShoppingListMember[]> {
  const userId = getCurrentUserId()
  if (!userId) return []

  const supabase = createClient()
  const { data: rows, error } = await supabase
    .from('shopping_list_members')
    .select('*')
    .eq('list_id', listId)
    .order('joined_at', { ascending: true })
  if (error || !rows) return []

  const userIds = rows.map((r) => r.user_id)
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
    const profile = profileMap.get(row.user_id)
    return {
      listId: row.list_id,
      userId: row.user_id,
      username: profile?.username ?? '',
      avatarUrl: profile?.avatarUrl ?? null,
      joinedAt: row.joined_at,
    }
  })
}

export async function removeMember(listId: string, memberUserId: string): Promise<boolean> {
  const supabase = createClient()
  const { error } = await supabase
    .from('shopping_list_members')
    .delete()
    .eq('list_id', listId)
    .eq('user_id', memberUserId)
  return !error
}

export async function leaveList(listId: string): Promise<boolean> {
  const userId = getCurrentUserId()
  if (!userId) return false
  return removeMember(listId, userId)
}
