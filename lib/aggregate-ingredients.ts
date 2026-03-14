import { getRecipe } from './storage'
import type { MealPlanEntry, Ingredient } from './types'

export interface AggregatedIngredient {
  name: string
  unit: string
  totalQuantity: number | null
  sources: { recipeTitle: string; quantity: number | null }[]
}

const UNIT_CONVERSIONS: Record<string, { base: string; factor: number }> = {
  kg: { base: 'g', factor: 1000 },
  l: { base: 'ml', factor: 1000 },
  dl: { base: 'ml', factor: 100 },
}

function normalizeUnit(
  unit: string,
  quantity: number | null,
): { unit: string; quantity: number | null } {
  const conversion = UNIT_CONVERSIONS[unit.toLowerCase()]
  if (conversion && quantity !== null) {
    return { unit: conversion.base, quantity: quantity * conversion.factor }
  }
  return { unit, quantity }
}

export async function aggregateIngredients(
  entries: MealPlanEntry[],
): Promise<AggregatedIngredient[]> {
  // Count how many times each recipe appears
  const recipeCounts = new Map<string, { count: number; title: string }>()
  for (const entry of entries) {
    const existing = recipeCounts.get(entry.recipeId)
    if (existing) {
      existing.count++
    } else {
      recipeCounts.set(entry.recipeId, { count: 1, title: entry.recipeTitle })
    }
  }

  // Fetch full recipes and build scaled ingredients
  const aggregated = new Map<string, AggregatedIngredient>()

  for (const [recipeId, { count, title }] of recipeCounts) {
    const recipe = await getRecipe(recipeId)
    if (!recipe) continue

    const multiplier = count / recipe.portions

    for (const ing of recipe.ingredients) {
      const rawQty = ing.quantity !== null ? ing.quantity * multiplier : null
      const { unit: normUnit, quantity: scaledQty } = normalizeUnit(ing.unit, rawQty)
      const key = `${ing.name.toLowerCase().trim()}::${normUnit.toLowerCase().trim()}`

      const existing = aggregated.get(key)
      if (existing) {
        if (existing.totalQuantity !== null && scaledQty !== null) {
          existing.totalQuantity += scaledQty
        } else {
          existing.totalQuantity = null
        }
        existing.sources.push({ recipeTitle: title, quantity: scaledQty })
      } else {
        aggregated.set(key, {
          name: ing.name,
          unit: normUnit,
          totalQuantity: scaledQty,
          sources: [{ recipeTitle: title, quantity: scaledQty }],
        })
      }
    }
  }

  return Array.from(aggregated.values())
}
