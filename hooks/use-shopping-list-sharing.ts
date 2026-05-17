import useSWR, { mutate as globalMutate } from 'swr'
import { createClient } from '@/lib/supabase/client'
import {
  getIncomingInvites,
  getOutgoingInvitesForList,
  sendInvite,
  acceptInvite,
  declineInvite,
  rescindInvite,
} from '@/lib/sync/shopping-list-invites-sync'
import {
  getMembersForList,
  removeMember,
  leaveList,
} from '@/lib/sync/shopping-list-members-sync'
import { useUser } from '@/hooks/use-user'

// ---------------------------------------------------------------------------
// Mutual follows (for the invite picker)
// ---------------------------------------------------------------------------

interface MutualFollow {
  userId: string
  username: string
  avatarUrl: string | null
}

async function fetchMutuals(userId: string): Promise<MutualFollow[]> {
  const supabase = createClient()

  const [{ data: outgoing }, { data: incoming }] = await Promise.all([
    supabase.from('follows').select('target_id').eq('user_id', userId),
    supabase.from('follows').select('user_id').eq('target_id', userId),
  ])

  const iFollow = new Set((outgoing ?? []).map((f) => f.target_id))
  const mutualIds = (incoming ?? [])
    .map((f) => f.user_id)
    .filter((id) => iFollow.has(id))

  if (mutualIds.length === 0) return []

  const { data: profiles } = await supabase
    .from('profiles')
    .select('user_id, username, avatar_url')
    .in('user_id', mutualIds)

  return (profiles ?? [])
    .map((p) => ({
      userId: p.user_id,
      username: p.username,
      avatarUrl: p.avatar_url ?? null,
    }))
    .sort((a, b) => a.username.localeCompare(b.username))
}

export function useMutualFollows() {
  const { user } = useUser()
  const { data, isLoading } = useSWR(
    user ? ['mutual-follows', user.id] : null,
    () => fetchMutuals(user!.id),
    { fallbackData: [], revalidateOnFocus: false },
  )
  return {
    mutuals: data ?? [],
    isLoading,
  }
}

// ---------------------------------------------------------------------------
// Incoming invites
// ---------------------------------------------------------------------------

const INCOMING_KEY = 'incoming-invites'

export function useIncomingInvites() {
  const { user } = useUser()
  const { data, isLoading } = useSWR(
    user ? INCOMING_KEY : null,
    getIncomingInvites,
    { fallbackData: [], revalidateOnFocus: true },
  )
  return {
    invites: data ?? [],
    isLoading,
  }
}

export async function acceptInviteAndRevalidate(
  inviteId: string,
  listId: string,
): Promise<boolean> {
  const ok = await acceptInvite(inviteId, listId)
  if (ok) {
    await globalMutate(INCOMING_KEY)
    await globalMutate('shopping-lists')
  }
  return ok
}

export async function declineInviteAndRevalidate(inviteId: string): Promise<boolean> {
  const ok = await declineInvite(inviteId)
  if (ok) await globalMutate(INCOMING_KEY)
  return ok
}

// ---------------------------------------------------------------------------
// Outgoing invites (per list, used in manage dialog)
// ---------------------------------------------------------------------------

function outgoingKey(listId: string) {
  return ['outgoing-invites', listId]
}

export function useOutgoingInvitesForList(listId: string | null) {
  const { data, isLoading } = useSWR(
    listId ? outgoingKey(listId) : null,
    () => getOutgoingInvitesForList(listId!),
    { fallbackData: [], revalidateOnFocus: true },
  )
  return {
    invites: data ?? [],
    isLoading,
  }
}

export async function sendInviteAndRevalidate(
  listId: string,
  inviteeId: string,
): Promise<boolean> {
  const ok = await sendInvite(listId, inviteeId)
  if (ok) await globalMutate(outgoingKey(listId))
  return ok
}

export async function rescindInviteAndRevalidate(
  inviteId: string,
  listId: string,
): Promise<boolean> {
  const ok = await rescindInvite(inviteId)
  if (ok) await globalMutate(outgoingKey(listId))
  return ok
}

// ---------------------------------------------------------------------------
// Members
// ---------------------------------------------------------------------------

function membersKey(listId: string) {
  return ['list-members', listId]
}

export function useListMembers(listId: string | null) {
  const { data, isLoading } = useSWR(
    listId ? membersKey(listId) : null,
    () => getMembersForList(listId!),
    { fallbackData: [], revalidateOnFocus: true },
  )
  return {
    members: data ?? [],
    isLoading,
  }
}

export async function removeMemberAndRevalidate(
  listId: string,
  userId: string,
): Promise<boolean> {
  const ok = await removeMember(listId, userId)
  if (ok) await globalMutate(membersKey(listId))
  return ok
}

export async function leaveListAndRevalidate(listId: string): Promise<boolean> {
  const ok = await leaveList(listId)
  if (ok) {
    await globalMutate(membersKey(listId))
    await globalMutate('shopping-lists')
    await globalMutate(
      (key) =>
        key === 'shopping-items' || (Array.isArray(key) && key[0] === 'shopping-items'),
    )
  }
  return ok
}
