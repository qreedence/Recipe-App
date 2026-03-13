export interface Macros {
  kcal: number
  carbs: number
  fat: number
  protein: number
}

// The predefined units, grouped for the dropdown later
export const INGREDIENT_UNITS = [
  // Weight
  'g',
  'kg',
  // Volume
  'ml',
  'dl',
  'l',
  'tsp',
  'tbsp',
  'cup',
  // Count
  'st',
  'cloves',
  'slices',
  'pieces',
  // Other
  'pinch',
  'bunch',
  'can',
  'package',
  'bag',
] as const

export type IngredientUnit = (typeof INGREDIENT_UNITS)[number]

export interface Ingredient {
  id: string
  name: string
  quantity: number | null
  unit: string // IngredientUnit or freeform
  macros: Macros | null
  originalAmount?: string // migration artifact
}

export interface Recipe {
  id: string
  title: string
  portions: number
  isFavorite: boolean
  ingredients: Ingredient[]
  steps: string[]
  image: string | null
  macros: Macros
  macroMode: 'auto' | 'manual'
  tags: string[]
  rating: number | null
  createdAt: number
}

export interface MealPlanEntry {
  id: string // "2025-03-12_Lunch" — unique per slot
  date: string // "2025-03-12" — ISO date, indexable for week queries
  mealType: MealType
  recipeId: string
  recipeTitle: string
  recipeMacros: Macros
  recipeImage: string | null
}

export const PRESET_TAGS = [
  'Chicken',
  'Beef',
  'Pork',
  'Fish',
  'Vegan',
  'Vegetarian',
  'Pasta',
  'Soup',
  'Salad',
  'Breakfast',
  'Dessert',
  'Snack',
  'High Protein',
  'Low Carb',
  'Low FODMAP',
  'Gluten Free',
  'Dairy Free',
  'Quick Meal',
] as const

export const EMPTY_MACROS: Macros = { kcal: 0, carbs: 0, fat: 0, protein: 0 }

export const GROCERY_CATEGORIES = [
  'Fruits & Vegetables',
  'Meat & Seafood',
  'Dairy & Eggs',
  'Bakery',
  'Frozen',
  'Canned & Jarred',
  'Grains & Pasta',
  'Snacks',
  'Condiments & Sauces',
  'Spices & Seasonings',
  'Beverages',
  'Household/Cleaning',
  'Hygiene',
  'Other',
] as const

export const ALL_MEAL_TYPES = ['Breakfast', 'Brunch', 'Lunch', 'Dinner', 'Snack'] as const

export type MealType = (typeof ALL_MEAL_TYPES)[number]

export const DEFAULT_MEAL_TYPES: MealType[] = ['Lunch', 'Dinner']

export interface MealTypeConfig {
  id: string // weekday index "0"-"6" (Mon-Sun, matching your DAY_LABELS)
  enabledTypes: MealType[]
}

export type GroceryCategory = (typeof GROCERY_CATEGORIES)[number]

export interface ShoppingItem {
  id: string
  name: string
  amount: string
  checked: boolean
  category: string | null
  recipeId: string | null
  recipeTitle: string | null
  createdAt: number
}
