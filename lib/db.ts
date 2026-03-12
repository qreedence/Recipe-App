import Dexie, { type EntityTable } from "dexie"
import { Recipe, ShoppingItem } from "./types"

const db = new Dexie("recipebook") as Dexie & {
  recipes: EntityTable<Recipe, "id">
  shoppingItems: EntityTable<ShoppingItem, "id">
}

db.version(1).stores({
  recipes: "id, title, createdAt, rating, *tags, isFavorite",
  shoppingItems: "id, checked, category, recipeId, createdAt",
})

db.version(2).stores({
  mealPlanEntries: "id, date, mealType",
})

export { db }
