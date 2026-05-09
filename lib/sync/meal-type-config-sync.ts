import { db } from '@/lib/db'
import { createClient } from '@/lib/supabase/client'
import { getCurrentUserId } from '@/lib/supabase/session'
import type { TablesInsert, Tables } from '@/lib/supabase/database.types'
import type { MealTypeConfig } from '@/lib/types'
import { enqueue, peekAll } from './queue'
import { drain, registerSyncDispatcher, type SyncDispatcher } from './worker'

// ---------------------------------------------------------------------------
// Row <-> domain type mapping
// The local MealTypeConfig.id is the weekday index as a string ("0"-"6").
// Supabase uses a composite PK (user_id, weekday).
// ---------------------------------------------------------------------------

function configToRow(config: MealTypeConfig, userId: string): TablesInsert<'meal_type_config'> {
  return {
    user_id: userId,
    weekday: Number(config.id),
    enabled_types: config.enabledTypes,
  }
}

function rowToConfig(row: Tables<'meal_type_config'>): MealTypeConfig {
  return {
    id: String(row.weekday),
    enabledTypes: row.enabled_types,
  }
}

// ---------------------------------------------------------------------------
// Dispatcher
// Uses the composite rowKey format "user_id:weekday" for deletes.
// ---------------------------------------------------------------------------

const dispatcher: SyncDispatcher = async (write) => {
  const supabase = createClient()

  if (write.operation === 'upsert') {
    if (!write.payload) throw new Error('meal_type_config upsert missing payload')
    const { error } = await supabase.from('meal_type_config').upsert(write.payload as TablesInsert<'meal_type_config'>)
    if (error) throw new Error(error.message)
    return
  }

  if (write.operation === 'delete') {
    const userId = getCurrentUserId()
    if (!userId) throw new Error('not authenticated')
    const { error } = await supabase
      .from('meal_type_config')
      .delete()
      .eq('user_id', userId)
      .eq('weekday', Number(write.rowKey))
    if (error) throw new Error(error.message)
    return
  }
}

registerSyncDispatcher('meal_type_config', dispatcher)

// ---------------------------------------------------------------------------
// Hydration
// ---------------------------------------------------------------------------

export async function hydrateMealTypeConfigFromCloud(): Promise<void> {
  const userId = getCurrentUserId()
  if (!userId) return

  const supabase = createClient()
  const { data, error } = await supabase.from('meal_type_config').select('*').eq('user_id', userId)
  if (error || !data) return

  const pending = await peekAll()
  const pendingKeys = new Set(
    pending.filter((p) => p.table === 'meal_type_config').map((p) => p.rowKey),
  )

  const toUpsert = data
    .filter((row) => !pendingKeys.has(String(row.weekday)))
    .map(rowToConfig)
  if (toUpsert.length > 0) {
    await db.mealTypeConfig.bulkPut(toUpsert)
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function getMealTypeConfigs(): Promise<MealTypeConfig[]> {
  return db.mealTypeConfig.toArray()
}

export async function saveMealTypeConfig(config: MealTypeConfig): Promise<void> {
  await db.mealTypeConfig.put(config)
  const userId = getCurrentUserId()
  if (!userId) return
  await enqueue('meal_type_config', 'upsert', config.id, configToRow(config, userId))
  void drain()
}

// ---------------------------------------------------------------------------
// Migration
// ---------------------------------------------------------------------------

export async function migrateLocalMealTypeConfigToCloud(): Promise<number> {
  const userId = getCurrentUserId()
  if (!userId) return 0

  const localConfigs = await db.mealTypeConfig.toArray()
  if (localConfigs.length === 0) return 0

  const supabase = createClient()
  const { data, error } = await supabase
    .from('meal_type_config')
    .select('weekday')
    .eq('user_id', userId)
  if (error) return 0

  const cloudWeekdays = new Set((data ?? []).map((r) => String(r.weekday)))
  const missing = localConfigs.filter((c) => !cloudWeekdays.has(c.id))

  if (missing.length === 0) return 0

  for (const config of missing) {
    try {
      await enqueue('meal_type_config', 'upsert', config.id, configToRow(config, userId))
    } catch {
      // Skip and continue
    }
  }

  return missing.length
}
