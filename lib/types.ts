export interface Macros {
  kcal: number
  carbs: number
  fat: number
  protein: number
}

export interface Ingredient {
  id: string
  name: string
  amount: string
  macros: Macros | null
}

export interface Recipe {
  id: string
  title: string
  portions: number
  ingredients: Ingredient[]
  steps: string[]
  image: string | null
  macros: Macros
  macroMode: "auto" | "manual"
  tags: string[]
  rating: number | null
  createdAt: number
}

export const PRESET_TAGS = [
  "Chicken",
  "Beef",
  "Pork",
  "Fish",
  "Vegan",
  "Vegetarian",
  "Pasta",
  "Soup",
  "Salad",
  "Breakfast",
  "Dessert",
  "Snack",
  "High Protein",
  "Low Carb",
  "Low FODMAP",
  "Gluten Free",
  "Dairy Free",
  "Quick Meal",
] as const

export const EMPTY_MACROS: Macros = { kcal: 0, carbs: 0, fat: 0, protein: 0 }

export const GROCERY_CATEGORIES = [
  "Produce",
  "Meat & Seafood",
  "Dairy & Eggs",
  "Bakery",
  "Frozen",
  "Canned & Jarred",
  "Grains & Pasta",
  "Snacks",
  "Condiments & Sauces",
  "Spices & Seasonings",
  "Beverages",
  "Other",
] as const

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
