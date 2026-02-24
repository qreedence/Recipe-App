import useSWR, { mutate as globalMutate } from "swr"
import { getRecipes, getRecipe, saveRecipe as storageSave, updateRecipe as storageUpdate, deleteRecipe as storageDelete } from "@/lib/storage"
import { Recipe } from "@/lib/types"

export function useRecipes() {
  const { data, error, isLoading } = useSWR("recipes", getRecipes, {
    fallbackData: [],
    revalidateOnFocus: false,
  })

  return {
    recipes: data ?? [],
    isLoading,
    error,
  }
}

export function useRecipe(id: string) {
  const { data, error, isLoading } = useSWR(
    id ? `recipe-${id}` : null,
    () => getRecipe(id),
    { revalidateOnFocus: false }
  )

  return {
    recipe: data ?? null,
    isLoading,
    error,
  }
}

export async function saveRecipeAndRevalidate(recipe: Recipe) {
  await storageSave(recipe)
  await globalMutate("recipes")
  await globalMutate(`recipe-${recipe.id}`)
}

export async function updateRecipeAndRevalidate(id: string, updates: Partial<Recipe>) {
  await storageUpdate(id, updates)
  await globalMutate("recipes")
  await globalMutate(`recipe-${id}`)
}

export async function deleteRecipeAndRevalidate(id: string) {
  await storageDelete(id)
  await globalMutate("recipes")
  await globalMutate(`recipe-${id}`)
}
