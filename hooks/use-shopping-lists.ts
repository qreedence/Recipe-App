import useSWR, { mutate as globalMutate } from 'swr'
import { useMemo } from 'react'
import {
  getShoppingLists,
  createShoppingList,
  renameShoppingList,
  deleteShoppingList,
} from '@/lib/sync/shopping-lists-sync'
import { createClient } from '@/lib/supabase/client'
import { useUser, revalidateUser } from '@/hooks/use-user'
import type { ShoppingList } from '@/lib/types'

const LISTS_KEY = 'shopping-lists'

export function useShoppingLists() {
  const { data, error, isLoading } = useSWR(LISTS_KEY, getShoppingLists, {
    fallbackData: [],
    revalidateOnFocus: true,
  })

  return {
    lists: data ?? [],
    isLoading,
    error,
  }
}

// Derives the active list from the user's profile preference, falling back
// to the first list they're a member of (the one created by migration 008's
// backfill or the signup trigger).
export function useActiveList() {
  const { user, defaultShoppingListId, loading: userLoading } = useUser()
  const { lists, isLoading: listsLoading } = useShoppingLists()

  const activeList = useMemo<ShoppingList | null>(() => {
    if (lists.length === 0) return null
    if (defaultShoppingListId) {
      const match = lists.find((l) => l.id === defaultShoppingListId)
      if (match) return match
    }
    return lists[0]
  }, [lists, defaultShoppingListId])

  return {
    activeListId: activeList?.id ?? null,
    activeList,
    isLoading: userLoading || listsLoading,
    isAuthed: !!user,
  }
}

async function revalidateLists() {
  await globalMutate(LISTS_KEY)
}

export async function createListAndRevalidate(name: string): Promise<ShoppingList | null> {
  const list = await createShoppingList(name)
  await revalidateLists()
  return list
}

export async function renameListAndRevalidate(id: string, name: string): Promise<boolean> {
  const ok = await renameShoppingList(id, name)
  if (ok) await revalidateLists()
  return ok
}

export async function deleteListAndRevalidate(id: string): Promise<boolean> {
  const ok = await deleteShoppingList(id)
  if (ok) {
    await revalidateLists()
    // The active item view may need to drop deleted items + recalc active list.
    await globalMutate(
      (key) => Array.isArray(key) && key[0] === 'shopping-items',
    )
    await revalidateUser()
  }
  return ok
}

export async function setActiveListAndRevalidate(listId: string): Promise<boolean> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const { error } = await supabase
    .from('profiles')
    .update({ default_shopping_list_id: listId })
    .eq('user_id', user.id)
  if (error) return false

  await revalidateUser()
  return true
}
