// Recipes: write-behind sync layer.
//
// Reads hit Dexie only. Hydration pulls the authoritative server state into
// Dexie on sign-in; SWR revalidates and the UI updates. Writes go to Dexie
// immediately and enqueue a pending sync; the worker drains the queue
// in the background when online + authed.

import { db } from '@/lib/db'
import { createClient } from '@/lib/supabase/client'
import { getCurrentUserId } from '@/lib/supabase/session'
import { uploadImage, isBase64Image } from '@/lib/upload-image'
import type {
  Tables,
  TablesInsert,
} from '@/lib/supabase/database.types'
import type { Recipe } from '@/lib/types'
import { enqueue, peekAll } from './queue'
import { drain, registerSyncDispatcher, type SyncDispatcher } from './worker'

// ---------------------------------------------------------------------------
// Row <-> domain type mapping
// ---------------------------------------------------------------------------

function recipeToRow(recipe: Recipe, userId: string): TablesInsert<'recipes'> {
  return {
    id: recipe.id,
    user_id: userId,
    title: recipe.title,
    portions: Math.round(recipe.portions),
    is_favorite: recipe.isFavorite,
    ingredients: recipe.ingredients,
    steps: recipe.steps,
    image: recipe.image,
    macros: recipe.macros,
    macro_mode: recipe.macroMode,
    tags: recipe.tags,
    rating: recipe.rating,
    created_at: recipe.createdAt,
  }
}

function rowToRecipe(row: Tables<'recipes'>): Recipe {
  return {
    id: row.id,
    title: row.title,
    portions: row.portions,
    isFavorite: row.is_favorite,
    ingredients: row.ingredients,
    steps: row.steps,
    image: row.image,
    macros: row.macros,
    macroMode: row.macro_mode,
    tags: row.tags,
    rating: row.rating,
    createdAt: row.created_at,
  }
}

// ---------------------------------------------------------------------------
// Dispatcher — how the worker pushes a single pending write to Supabase
// ---------------------------------------------------------------------------

const dispatcher: SyncDispatcher = async (write) => {
  const supabase = createClient()

  if (write.operation === 'upsert') {
    if (!write.payload) throw new Error('recipes upsert missing payload')
    const { error } = await supabase.from('recipes').upsert(write.payload as TablesInsert<'recipes'>)
    if (error) throw new Error(error.message)
    return
  }

  if (write.operation === 'delete') {
    const { error } = await supabase.from('recipes').delete().eq('id', write.rowKey)
    if (error) throw new Error(error.message)
    return
  }
}

registerSyncDispatcher('recipes', dispatcher)

// ---------------------------------------------------------------------------
// Hydration — pull authoritative server state into Dexie
// ---------------------------------------------------------------------------

export async function hydrateRecipesFromCloud(): Promise<void> {
  const userId = getCurrentUserId()
  if (!userId) return

  const supabase = createClient()
  const { data, error } = await supabase.from('recipes').select('*').eq('user_id', userId)
  if (error || !data) return

  // Skip recipes that have an un-synced local write — we don't want hydration
  // to clobber a pending edit the user just made.
  const pending = await peekAll()
  const pendingRecipeIds = new Set(
    pending.filter((p) => p.table === 'recipes').map((p) => p.rowKey),
  )

  const toUpsert = data.filter((row) => !pendingRecipeIds.has(row.id)).map(rowToRecipe)
  if (toUpsert.length > 0) {
    await db.recipes.bulkPut(toUpsert)
  }
}

// ---------------------------------------------------------------------------
// Public API — matches lib/storage.ts signatures so hook consumers don't care
// ---------------------------------------------------------------------------

export async function getRecipes(): Promise<Recipe[]> {
  return db.recipes.orderBy('createdAt').reverse().toArray()
}

export async function getRecipe(id: string): Promise<Recipe | null> {
  return (await db.recipes.get(id)) ?? null
}

export async function saveRecipe(recipe: Recipe): Promise<void> {
  await db.recipes.put(recipe)
  const userId = getCurrentUserId()
  if (!userId) return
  await enqueue('recipes', 'upsert', recipe.id, recipeToRow(recipe, userId))
  void drain()
}

export async function updateRecipe(id: string, updates: Partial<Recipe>): Promise<void> {
  await db.recipes.update(id, updates)
  const userId = getCurrentUserId()
  if (!userId) return
  const full = await db.recipes.get(id)
  if (!full) return
  await enqueue('recipes', 'upsert', id, recipeToRow(full, userId))
  void drain()
}

export async function deleteRecipe(id: string): Promise<void> {
  await db.recipes.delete(id)
  const userId = getCurrentUserId()
  if (!userId) return
  await enqueue('recipes', 'delete', id, null)
  void drain()
}

// ---------------------------------------------------------------------------
// First sign-in migration — push all local Dexie recipes to the cloud
// ---------------------------------------------------------------------------

export async function migrateLocalRecipesToCloud(): Promise<number> {
  const userId = getCurrentUserId()
  if (!userId) return 0

  const localRecipes = await db.recipes.toArray()
  if (localRecipes.length === 0) return 0

  const supabase = createClient()
  const { data, error } = await supabase
    .from('recipes')
    .select('id')
    .eq('user_id', userId)
  if (error) return 0

  const cloudIds = new Set((data ?? []).map((r) => r.id))
  const missing = localRecipes.filter((r) => !cloudIds.has(r.id))
  if (missing.length === 0) return 0

  let migrated = 0
  for (const recipe of missing) {
    try {
      if (isBase64Image(recipe.image)) {
        try {
          recipe.image = await uploadImage(recipe.image!, recipe.id)
          await db.recipes.put(recipe)
        } catch {
          // Image upload failed — keep the base64 locally, sync without it
        }
      }
      await enqueue('recipes', 'upsert', recipe.id, recipeToRow(recipe, userId))
      migrated++
    } catch {
      // Skip this recipe, continue with the rest
    }
  }

  return migrated
}
