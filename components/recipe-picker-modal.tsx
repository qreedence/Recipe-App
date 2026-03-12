"use client"

import { useState, useMemo } from "react"
import { Flame, Drumstick, Check } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { SearchBar } from "@/components/search-bar"
import { useRecipes } from "@/hooks/use-recipes"
import type { Macros } from "@/lib/types"

export interface PickedRecipe {
  id: string
  title: string
  macros: Macros
  image: string | null
}

interface RecipePickerModalProps {
  open: boolean
  onClose: () => void
  onSelect: (recipe: PickedRecipe) => void
  plannedRecipeIds?: string[]
}

export function RecipePickerModal({
  open,
  onClose,
  onSelect,
  plannedRecipeIds = [],
}: RecipePickerModalProps) {
  const { recipes, isLoading } = useRecipes()
  const [search, setSearch] = useState("")

  const filtered = useMemo(() => {
   let result = recipes

   if (search.trim()) {
     const q = search.toLowerCase()
     result = result.filter(
       (r) =>
         r.title.toLowerCase().includes(q) ||
         r.ingredients.some((i) => i.name.toLowerCase().includes(q)) ||
         r.tags.some((t) => t.toLowerCase().includes(q))
     )
   }

   if (!search.trim() && plannedRecipeIds.length > 0) {
     const planned = result.filter((r) => plannedRecipeIds.includes(r.id))
     const rest = result.filter((r) => !plannedRecipeIds.includes(r.id))
     return [...planned, ...rest]
   }

   return result
 }, [recipes, search, plannedRecipeIds])

  function handleSelect(recipe: (typeof recipes)[number]) {
    onSelect({
      id: recipe.id,
      title: recipe.title,
      macros: recipe.macros,
      image: recipe.image,
    })
    setSearch("")
    onClose()
  }

  function handleOpenChange(isOpen: boolean) {
    if (!isOpen) {
      setSearch("")
      onClose()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md p-0 gap-0">
        <DialogHeader className="px-4 pt-4 pb-3">
          <DialogTitle className="text-base">Choose a recipe</DialogTitle>
             <DialogDescription className="sr-only">
              Search and select a recipe to add to your meal plan
            </DialogDescription>
        </DialogHeader>

        {/* Search */}
        <div className="px-4 pb-3">
          <SearchBar value={search} onChange={setSearch} />
        </div>

        {/* Recipe list */}
        <div className="overflow-y-auto max-h-[50vh] pb-2">
          {isLoading ? null : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center px-4">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                <Drumstick className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                {recipes.length === 0
                  ? "No recipes yet — create one first!"
                  : "No recipes match your search"}
              </p>
            </div>
          ) : (
            <ul role="listbox" className="px-2">
              {filtered.map((recipe) => {
                const perPortion = {
                  kcal:
                    recipe.portions > 0
                      ? Math.round(recipe.macros.kcal / recipe.portions)
                      : 0,
                  protein:
                    recipe.portions > 0
                      ? Math.round(recipe.macros.protein / recipe.portions)
                      : 0,
                }

                return (
                  <li key={recipe.id}>
                    <button
                      onClick={() => handleSelect(recipe)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent transition-colors duration-100 text-left ${
                        plannedRecipeIds.includes(recipe.id) ? "bg-primary/5" : ""
                        }`}
                      role="option"
                    >
                      {/* Thumbnail or placeholder */}
                      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center overflow-hidden shrink-0">
                        {recipe.image ? (
                          <img
                            src={recipe.image}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Drumstick className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {recipe.title}
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                          <span className="flex items-center gap-0.5">
                            <Flame className="h-3 w-3" />
                            {perPortion.kcal} kcal
                          </span>
                          <span>{perPortion.protein}g protein</span>
                        </p>
                      </div>
                      {plannedRecipeIds.includes(recipe.id) && (
                       <div className="shrink-0 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                         <Check className="h-3 w-3 text-primary" />
                       </div>
                     )}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}