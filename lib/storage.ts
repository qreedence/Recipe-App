import { db } from "./db"
import { MealPlanEntry, MealTypeConfig, Recipe, ShoppingItem } from "./types"

// Recipes

export async function getRecipes(): Promise<Recipe[]> {
  return db.recipes.orderBy("createdAt").reverse().toArray()
}

export async function getRecipe(id: string): Promise<Recipe | null> {
  return (await db.recipes.get(id)) ?? null
}

export async function saveRecipe(recipe: Recipe): Promise<void> {
  await db.recipes.put(recipe)
}

export async function updateRecipe(id: string, updates: Partial<import("./types").Recipe>): Promise<void> {
  await db.recipes.update(id, updates)
}

export async function deleteRecipe(id: string): Promise<void> {
  await db.recipes.delete(id)
}

// Shopping items

export async function getShoppingItems(): Promise<ShoppingItem[]> {
  return db.shoppingItems.orderBy("createdAt").toArray()
}

export async function addShoppingItems(items: ShoppingItem[]): Promise<void> {
  await db.shoppingItems.bulkPut(items)
}

export async function updateShoppingItem(id: string, updates: Partial<ShoppingItem>): Promise<void> {
  await db.shoppingItems.update(id, updates)
}

export async function deleteShoppingItem(id: string): Promise<void> {
  await db.shoppingItems.delete(id)
}

export async function clearCheckedItems(): Promise<void> {
  const all = await db.shoppingItems.toArray();
  const checked = all.filter((i) => i.checked);
  await db.shoppingItems.bulkDelete(checked.map((i) => i.id));
}

export async function clearAllShoppingItems(): Promise<void> {
  await db.shoppingItems.clear()
}

// Meal plan

export async function getMealPlanEntries(weekDates: string[]): Promise<MealPlanEntry[]> {
  return db.mealPlanEntries.where("date").anyOf(weekDates).toArray()
}

export async function saveMealPlanEntry(entry: MealPlanEntry): Promise<void> {
  await db.mealPlanEntries.put(entry)
}

export async function deleteMealPlanEntry(id: string): Promise<void> {
  await db.mealPlanEntries.delete(id)
}

// Meal type config

export async function getMealTypeConfigs(): Promise<MealTypeConfig[]> {
  return db.mealTypeConfig.toArray()
}

export async function saveMealTypeConfig(config: MealTypeConfig): Promise<void> {
  await db.mealTypeConfig.put(config)
}