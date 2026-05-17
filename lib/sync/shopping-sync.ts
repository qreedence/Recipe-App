import { db } from '@/lib/db'
import { createClient } from '@/lib/supabase/client'
import { getCurrentUserId } from '@/lib/supabase/session'
import type { TablesInsert, Tables } from '@/lib/supabase/database'
import type { ShoppingItem } from '@/lib/types'
import { enqueue, peekAll, hasPendingForTable } from './queue'
import { drain, registerSyncDispatcher, type SyncDispatcher } from './worker'

// ---------------------------------------------------------------------------
// Default shopping list resolver
//
// Every authenticated user has at least one shopping_lists row they created
// (guaranteed by the auth.users insert trigger added in migration 008). PR 1
// always writes to that one list; multi-list selection is wired up in PR 2.
// ---------------------------------------------------------------------------

let cachedDefaultListId: { userId: string; listId: string } | null = null

async function getDefaultListId(): Promise<string | null> {
  const userId = getCurrentUserId()
  if (!userId) return null

  if (cachedDefaultListId && cachedDefaultListId.userId === userId) {
    return cachedDefaultListId.listId
  }

  const supabase = createClient()
  const { data } = await supabase
    .from('shopping_lists')
    .select('id')
    .eq('created_by', userId)
    .order('created_at', { ascending: true })
    .limit(1)

  if (data && data.length > 0) {
    cachedDefaultListId = { userId, listId: data[0].id }
    return data[0].id
  }

  // Safety net: the signup trigger should have created this, but cover
  // the race where the trigger hasn't fired yet or an older account
  // pre-dates the trigger AND somehow missed the migration backfill.
  const { data: created, error } = await supabase
    .from('shopping_lists')
    .insert({ name: 'My Shopping List', created_by: userId })
    .select('id')
    .single()
  if (error || !created) return null

  await supabase
    .from('shopping_list_members')
    .insert({ list_id: created.id, user_id: userId })

  cachedDefaultListId = { userId, listId: created.id }
  return created.id
}

// ---------------------------------------------------------------------------
// Row <-> domain mapping
// ---------------------------------------------------------------------------

function itemToRow(item: ShoppingItem, listId: string): TablesInsert<'shopping_items'> {
  return {
    id: item.id,
    list_id: listId,
    name: item.name,
    amount: item.amount,
    checked: item.checked,
    category: item.category,
    recipe_id: item.recipeId,
    recipe_title: item.recipeTitle,
    created_at: item.createdAt,
  }
}

function rowToItem(row: Tables<'shopping_items'>): ShoppingItem {
  return {
    id: row.id,
    name: row.name,
    amount: row.amount,
    checked: row.checked,
    category: row.category,
    recipeId: row.recipe_id,
    recipeTitle: row.recipe_title,
    createdAt: row.created_at,
  }
}

// ---------------------------------------------------------------------------
// Dispatcher
//
// Rebuilds the upsert payload from current Dexie state at dispatch time. This
// both keeps the row in sync with the latest local edits and absorbs stale
// payloads from before the list_id migration without a schema migration on
// pendingWrites.
// ---------------------------------------------------------------------------

const dispatcher: SyncDispatcher = async (write) => {
  const supabase = createClient()

  if (write.operation === 'upsert') {
    const item = await db.shoppingItems.get(write.rowKey)
    if (!item) return // Locally deleted between enqueue and drain.

    const listId = await getDefaultListId()
    if (!listId) throw new Error('No default shopping list available')

    const { error } = await supabase.from('shopping_items').upsert(itemToRow(item, listId))
    if (error) throw new Error(error.message)
    return
  }

  if (write.operation === 'delete') {
    const { error } = await supabase.from('shopping_items').delete().eq('id', write.rowKey)
    if (error) throw new Error(error.message)
    return
  }
}

registerSyncDispatcher('shopping_items', dispatcher)

// ---------------------------------------------------------------------------
// Hydration
//
// RLS filters by list membership, so we don't need a where-clause: a SELECT
// returns exactly the items the current user can see.
// ---------------------------------------------------------------------------

export async function hydrateShoppingFromCloud(): Promise<void> {
  const userId = getCurrentUserId()
  if (!userId) return

  const supabase = createClient()
  const { data, error } = await supabase.from('shopping_items').select('*')
  if (error || !data) return

  const pending = await peekAll()
  const pendingIds = new Set(
    pending.filter((p) => p.table === 'shopping_items').map((p) => p.rowKey),
  )

  const toUpsert = data.filter((row) => !pendingIds.has(row.id)).map(rowToItem)
  if (toUpsert.length > 0) {
    await db.shoppingItems.bulkPut(toUpsert)
  }
}

// ---------------------------------------------------------------------------
// Public API (unchanged signatures — UI/hooks keep working as-is)
// ---------------------------------------------------------------------------

export async function getShoppingItems(): Promise<ShoppingItem[]> {
  const userId = getCurrentUserId()
  if (userId && !(await hasPendingForTable('shopping_items'))) {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('shopping_items')
        .select('*')
        .order('created_at', { ascending: true })
      if (!error && data) {
        const items = data.map(rowToItem)
        await db.shoppingItems.bulkPut(items)
        return items
      }
    } catch {}
  }
  return db.shoppingItems.orderBy('createdAt').toArray()
}

export async function addShoppingItems(items: ShoppingItem[]): Promise<void> {
  await db.shoppingItems.bulkPut(items)
  const userId = getCurrentUserId()
  if (!userId) return
  const listId = await getDefaultListId()
  if (!listId) return
  const rows = items.map((item) => itemToRow(item, listId))
  try {
    const supabase = createClient()
    const { error } = await supabase.from('shopping_items').upsert(rows)
    if (!error) return
  } catch {}
  for (const item of items) {
    await enqueue('shopping_items', 'upsert', item.id, itemToRow(item, listId))
  }
}

export async function updateShoppingItem(id: string, updates: Partial<ShoppingItem>): Promise<void> {
  await db.shoppingItems.update(id, updates)
  const full = await db.shoppingItems.get(id)
  if (!full) return
  const userId = getCurrentUserId()
  if (!userId) return
  const listId = await getDefaultListId()
  if (!listId) return
  try {
    const supabase = createClient()
    const { error } = await supabase.from('shopping_items').upsert(itemToRow(full, listId))
    if (!error) return
  } catch {}
  await enqueue('shopping_items', 'upsert', id, itemToRow(full, listId))
}

export async function deleteShoppingItem(id: string): Promise<void> {
  await db.shoppingItems.delete(id)
  const userId = getCurrentUserId()
  if (!userId) return
  try {
    const supabase = createClient()
    const { error } = await supabase.from('shopping_items').delete().eq('id', id)
    if (!error) return
  } catch {}
  await enqueue('shopping_items', 'delete', id, null)
}

export async function clearCheckedItems(): Promise<void> {
  const all = await db.shoppingItems.toArray()
  const checked = all.filter((i) => i.checked)
  await db.shoppingItems.bulkDelete(checked.map((i) => i.id))
  const userId = getCurrentUserId()
  if (!userId) return
  const ids = checked.map((i) => i.id)
  try {
    const supabase = createClient()
    const { error } = await supabase.from('shopping_items').delete().in('id', ids)
    if (!error) return
  } catch {}
  for (const item of checked) {
    await enqueue('shopping_items', 'delete', item.id, null)
  }
}

export async function clearAllShoppingItems(): Promise<void> {
  const all = await db.shoppingItems.toArray()
  await db.shoppingItems.clear()
  const userId = getCurrentUserId()
  if (!userId) return
  const ids = all.map((i) => i.id)
  try {
    const supabase = createClient()
    const { error } = await supabase.from('shopping_items').delete().in('id', ids)
    if (!error) return
  } catch {}
  for (const item of all) {
    await enqueue('shopping_items', 'delete', item.id, null)
  }
}

// ---------------------------------------------------------------------------
// First-sign-in migration: push local-only items to cloud
// ---------------------------------------------------------------------------

export async function migrateLocalShoppingToCloud(): Promise<number> {
  const userId = getCurrentUserId()
  if (!userId) return 0

  const localItems = await db.shoppingItems.toArray()
  if (localItems.length === 0) return 0

  const listId = await getDefaultListId()
  if (!listId) return 0

  const supabase = createClient()
  const { data, error } = await supabase.from('shopping_items').select('id')
  if (error) return 0

  const cloudIds = new Set((data ?? []).map((r) => r.id))
  const missing = localItems.filter((i) => !cloudIds.has(i.id))
  if (missing.length === 0) return 0

  for (const item of missing) {
    await enqueue('shopping_items', 'upsert', item.id, itemToRow(item, listId))
  }

  void drain()

  return missing.length
}
