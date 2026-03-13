import Dexie, { type EntityTable } from 'dexie'
import { MealPlanEntry, MealTypeConfig, Recipe, ShoppingItem } from './types'
import { parseAmount } from './parse-amount'

const db = new Dexie('recipebook') as Dexie & {
  recipes: EntityTable<Recipe, 'id'>
  shoppingItems: EntityTable<ShoppingItem, 'id'>
  mealPlanEntries: EntityTable<MealPlanEntry, 'id'>
  mealTypeConfig: EntityTable<MealTypeConfig, 'id'>
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

export { db }
