import Dexie, { type EntityTable } from 'dexie'
import {
  MealPlanEntry,
  MealTypeConfig,
  Recipe,
  RecipeDraft,
  ShoppingItem,
  ShoppingList,
} from './types'
import type { PendingWrite } from './sync/types'
import { parseAmount } from './parse-amount'

const db = new Dexie('recipebook') as Dexie & {
  recipes: EntityTable<Recipe, 'id'>
  shoppingItems: EntityTable<ShoppingItem, 'id'>
  shoppingLists: EntityTable<ShoppingList, 'id'>
  mealPlanEntries: EntityTable<MealPlanEntry, 'id'>
  mealTypeConfig: EntityTable<MealTypeConfig, 'id'>
  recipeDrafts: EntityTable<RecipeDraft, 'id'>
  pendingWrites: EntityTable<PendingWrite, 'id'>
}

db.version(1).stores({
  recipes: 'id, title, createdAt, rating, *tags, isFavorite',
  shoppingItems: 'id, checked, category, recipeId, createdAt',
})

db.version(2).stores({
  mealPlanEntries: 'id, date, mealType',
})

db.version(3).stores({
  mealTypeConfig: 'id',
})

db.version(4)
  .stores({})
  .upgrade(async (tx) => {
    const recipes = tx.table('recipes')
    await recipes.toCollection().modify((recipe) => {
      recipe.ingredients = recipe.ingredients.map((ing: any) => {
        const parsed = parseAmount(ing.amount ?? '')
        const migrated: any = {
          id: ing.id,
          name: ing.name,
          quantity: parsed.quantity,
          unit: parsed.unit,
          macros: ing.macros,
        }
        if (parsed.quantity === null && ing.amount) {
          migrated.originalAmount = ing.amount
        }
        return migrated
      })
    })
  })

db.version(5).stores({
  recipeDrafts: 'id',
})

// Write-behind queue for Supabase sync. Auto-increment id preserves insert order
// so the drain worker replays operations in the sequence the user made them.
db.version(6).stores({
  pendingWrites: '++id, table, createdAt',
})

db.version(7).stores({
  pendingWrites: '++id, table, createdAt, attemptCount',
})

// v8: introduce shopping lists.
//
// shoppingItems gains a listId index. Existing local items keep listId
// undefined until the next sign-in hydration stamps them from the cloud
// row (which always has list_id). The shopping page falls back to "show
// all items" when no active list is selected, so unstamped items remain
// visible during the in-between window.
db.version(8).stores({
  shoppingItems: 'id, listId, checked, category, recipeId, createdAt',
  shoppingLists: 'id, createdBy',
})

export { db }
