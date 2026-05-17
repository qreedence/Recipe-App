// Shopping lists: cloud-first CRUD with a local Dexie cache.
//
// Item writes go through the write-behind queue so users can keep adding
// to their list offline. List management (create / rename / delete) is
// cloud-first: needs online + auth, returns null/false on failure so the
// UI can surface a toast. We can layer offline queueing on top later if
// users start hitting it.

import { db } from '@/lib/db'
import { createClient } from '@/lib/supabase/client'
import { getCurrentUserId } from '@/lib/supabase/session'
import type { Tables } from '@/lib/supabase/database'
import type { ShoppingList } from '@/lib/types'

function rowToList(row: Tables<'shopping_lists'>): ShoppingList {
  return {
    id: row.id,
    name: row.name,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

export async function getShoppingLists(): Promise<ShoppingList[]> {
  const userId = getCurrentUserId()
  if (userId) {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('shopping_lists')
        .select('*')
        .order('created_at', { ascending: true })
      if (!error && data) {
        const lists = data.map(rowToList)
        await db.shoppingLists.clear()
        await db.shoppingLists.bulkPut(lists)
        return lists
      }
    } catch {}
  }
  return db.shoppingLists.toArray()
}

export async function hydrateShoppingListsFromCloud(): Promise<void> {
  const userId = getCurrentUserId()
  if (!userId) return
  const supabase = createClient()
  const { data, error } = await supabase
    .from('shopping_lists')
    .select('*')
    .order('created_at', { ascending: true })
  if (error || !data) return
  await db.shoppingLists.clear()
  await db.shoppingLists.bulkPut(data.map(rowToList))
}

// ---------------------------------------------------------------------------
// Writes
// ---------------------------------------------------------------------------

export async function createShoppingList(name: string): Promise<ShoppingList | null> {
  const userId = getCurrentUserId()
  if (!userId) return null
  const trimmed = name.trim()
  if (!trimmed) return null

  const supabase = createClient()
  const { data: listData, error: listError } = await supabase
    .from('shopping_lists')
    .insert({ name: trimmed, created_by: userId })
    .select()
    .single()
  if (listError || !listData) return null

  const { error: memberError } = await supabase
    .from('shopping_list_members')
    .insert({ list_id: listData.id, user_id: userId })
  if (memberError) {
    // Roll back the list so we don't leave an orphan the creator can't read.
    await supabase.from('shopping_lists').delete().eq('id', listData.id)
    return null
  }

  const list = rowToList(listData)
  await db.shoppingLists.put(list)
  return list
}

export async function renameShoppingList(id: string, name: string): Promise<boolean> {
  const userId = getCurrentUserId()
  if (!userId) return false
  const trimmed = name.trim()
  if (!trimmed) return false

  const supabase = createClient()
  const { data, error } = await supabase
    .from('shopping_lists')
    .update({ name: trimmed })
    .eq('id', id)
    .select()
    .single()
  if (error || !data) return false

  await db.shoppingLists.put(rowToList(data))
  return true
}

export async function deleteShoppingList(id: string): Promise<boolean> {
  const userId = getCurrentUserId()
  if (!userId) return false

  const supabase = createClient()
  const { error } = await supabase.from('shopping_lists').delete().eq('id', id)
  if (error) return false

  // Cascade deleted items on the cloud (FK ON DELETE CASCADE). Mirror locally.
  await db.shoppingLists.delete(id)
  await db.shoppingItems.where('listId').equals(id).delete()
  return true
}
