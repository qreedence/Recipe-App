import { db } from '@/lib/db'
import { createClient } from '@/lib/supabase/client'
import { getCurrentUserId } from '@/lib/supabase/session'
import type { TablesInsert, Tables } from '@/lib/supabase/database.types'
import type { MealPlanEntry } from '@/lib/types'
import { enqueue, peekAll } from './queue'
import { drain, registerSyncDispatcher, type SyncDispatcher } from './worker'

// ---------------------------------------------------------------------------
// Row <-> domain type mapping
// ---------------------------------------------------------------------------

function entryToRow(entry: MealPlanEntry, userId: string): TablesInsert<'meal_plan_entries'> {
  return {
    user_id: userId,
    date: entry.date,
    meal_type: entry.mealType,
    recipe_id: entry.recipeId,
    recipe_title: entry.recipeTitle,
    recipe_macros: entry.recipeMacros,
    recipe_image: entry.recipeImage,
  }
}

function rowToEntry(row: Tables<'meal_plan_entries'>): MealPlanEntry {
  return {
    id: `${row.date}_${row.meal_type}`,
    date: row.date,
    mealType: row.meal_type,
    recipeId: row.recipe_id,
    recipeTitle: row.recipe_title,
    recipeMacros: row.recipe_macros,
    recipeImage: row.recipe_image,
  }
}

// ---------------------------------------------------------------------------
// Dispatcher
// ---------------------------------------------------------------------------

const dispatcher: SyncDispatcher = async (write) => {
  const supabase = createClient()
  const userId = getCurrentUserId()
  if (!userId) throw new Error('not authenticated')

  if (write.operation === 'upsert') {
    if (!write.payload) throw new Error('meal_plan_entries upsert missing payload')
    const { error } = await supabase
      .from('meal_plan_entries')
      .upsert(write.payload as TablesInsert<'meal_plan_entries'>, {
        onConflict: 'user_id,date,meal_type',
      })
    if (error) throw new Error(error.message)
    return
  }

  if (write.operation === 'delete') {
    const [date, ...rest] = write.rowKey.split('_')
    const mealType = rest.join('_')
    const { error } = await supabase
      .from('meal_plan_entries')
      .delete()
      .eq('user_id', userId)
      .eq('date', date)
      .eq('meal_type', mealType)
    if (error) throw new Error(error.message)
    return
  }
}

registerSyncDispatcher('meal_plan_entries', dispatcher)

// ---------------------------------------------------------------------------
// Hydration
// ---------------------------------------------------------------------------

export async function hydrateMealPlanFromCloud(): Promise<void> {
  const userId = getCurrentUserId()
  if (!userId) return

  const supabase = createClient()
  const { data, error } = await supabase.from('meal_plan_entries').select('*').eq('user_id', userId)
  if (error || !data) return

  const pending = await peekAll()
  const pendingIds = new Set(
    pending.filter((p) => p.table === 'meal_plan_entries').map((p) => p.rowKey),
  )

  const toUpsert = data.filter((row) => !pendingIds.has(row.id)).map(rowToEntry)
  if (toUpsert.length > 0) {
    await db.mealPlanEntries.bulkPut(toUpsert)
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function getMealPlanEntries(weekDates: string[]): Promise<MealPlanEntry[]> {
  return db.mealPlanEntries.where('date').anyOf(weekDates).toArray()
}

export async function saveMealPlanEntry(entry: MealPlanEntry): Promise<void> {
  await db.mealPlanEntries.put(entry)
  const userId = getCurrentUserId()
  if (!userId) return
  await enqueue('meal_plan_entries', 'upsert', entry.id, entryToRow(entry, userId))
  void drain()
}

export async function deleteMealPlanEntry(id: string): Promise<void> {
  await db.mealPlanEntries.delete(id)
  const userId = getCurrentUserId()
  if (!userId) return
  await enqueue('meal_plan_entries', 'delete', id, null)
  void drain()
}

export async function clearMealPlanEntries(weekDates: string[]): Promise<void> {
  const entries = await db.mealPlanEntries.where('date').anyOf(weekDates).toArray()
  await db.mealPlanEntries.bulkDelete(entries.map((e) => e.id))
  const userId = getCurrentUserId()
  if (!userId) return
  for (const entry of entries) {
    await enqueue('meal_plan_entries', 'delete', entry.id, null)
  }
  void drain()
}

// ---------------------------------------------------------------------------
// Migration
// ---------------------------------------------------------------------------

export async function migrateLocalMealPlanToCloud(): Promise<number> {
  const userId = getCurrentUserId()
  if (!userId) return 0

  const localEntries = await db.mealPlanEntries.toArray()
  if (localEntries.length === 0) return 0

  const supabase = createClient()
  const { data, error } = await supabase
    .from('meal_plan_entries')
    .select('date, meal_type')
    .eq('user_id', userId)
  if (error) return 0

  const cloudKeys = new Set((data ?? []).map((r) => `${r.date}_${r.meal_type}`))
  const missing = localEntries.filter((e) => !cloudKeys.has(e.id))
  if (missing.length === 0) return 0

  for (const entry of missing) {
    await enqueue('meal_plan_entries', 'upsert', entry.id, entryToRow(entry, userId))
  }

  return missing.length
}
