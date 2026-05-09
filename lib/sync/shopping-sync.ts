import { db } from '@/lib/db'
import { createClient } from '@/lib/supabase/client'
import { getCurrentUserId } from '@/lib/supabase/session'
import type { TablesInsert, Tables } from '@/lib/supabase/database.types'
import type { ShoppingItem } from '@/lib/types'
import { enqueue, peekAll, hasPendingForTable } from './queue'
import { drain, registerSyncDispatcher, type SyncDispatcher } from './worker'

// ---------------------------------------------------------------------------
// Row <-> domain type mapping
// ---------------------------------------------------------------------------

function itemToRow(item: ShoppingItem, userId: string): TablesInsert<'shopping_items'> {
  return {
    id: item.id,
    user_id: userId,
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
// ---------------------------------------------------------------------------

const dispatcher: SyncDispatcher = async (write) => {
  const supabase = createClient()

  if (write.operation === 'upsert') {
    if (!write.payload) throw new Error('shopping_items upsert missing payload')
    const { error } = await supabase.from('shopping_items').upsert(write.payload as TablesInsert<'shopping_items'>)
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
// ---------------------------------------------------------------------------

export async function hydrateShoppingFromCloud(): Promise<void> {
  const userId = getCurrentUserId()
  if (!userId) return

  const supabase = createClient()
  const { data, error } = await supabase.from('shopping_items').select('*').eq('user_id', userId)
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
// Public API
// ---------------------------------------------------------------------------

export async function getShoppingItems(): Promise<ShoppingItem[]> {
  const userId = getCurrentUserId()
  if (userId && !(await hasPendingForTable('shopping_items'))) {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('shopping_items')
        .select('*')
        .eq('user_id', userId)
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
  const rows = items.map((item) => itemToRow(item, userId))
  try {
    const supabase = createClient()
    const { error } = await supabase.from('shopping_items').upsert(rows)
    if (!error) return
  } catch {}
  for (const item of items) {
    await enqueue('shopping_items', 'upsert', item.id, itemToRow(item, userId))
  }
}

export async function updateShoppingItem(id: string, updates: Partial<ShoppingItem>): Promise<void> {
  await db.shoppingItems.update(id, updates)
  const full = await db.shoppingItems.get(id)
  if (!full) return
  const userId = getCurrentUserId()
  if (!userId) return
  try {
    const supabase = createClient()
    const { error } = await supabase.from('shopping_items').upsert(itemToRow(full, userId))
    if (!error) return
  } catch {}
  await enqueue('shopping_items', 'upsert', id, itemToRow(full, userId))
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
// Migration
// ---------------------------------------------------------------------------

export async function migrateLocalShoppingToCloud(): Promise<number> {
  const userId = getCurrentUserId()
  if (!userId) return 0

  const localItems = await db.shoppingItems.toArray()
  if (localItems.length === 0) return 0

  const supabase = createClient()
  const { data, error } = await supabase
    .from('shopping_items')
    .select('id')
    .eq('user_id', userId)
  if (error) return 0

  const cloudIds = new Set((data ?? []).map((r) => r.id))
  const missing = localItems.filter((i) => !cloudIds.has(i.id))
  if (missing.length === 0) return 0

  for (const item of missing) {
    await enqueue('shopping_items', 'upsert', item.id, itemToRow(item, userId))
  }

  return missing.length
}
