"use client"

import { useState, useMemo } from "react"
import { Flame, Drumstick } from "lucide-react"
import {
  Dialog,
  DialogContent,
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
}

export function RecipePickerModal({
  open,
  onClose,
  onSelect,
}: RecipePickerModalProps) {
  const { recipes, isLoading } = useRecipes()
  const [search, setSearch] = useState("")

  const filtered = useMemo(() => {
    if (!search.trim()) return recipes

    const q = search.toLowerCase()
    return recipes.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        r.ingredients.some((i) => i.name.toLowerCase().includes(q)) ||
        r.tags.some((t) => t.toLowerCase().includes(q))
    )
  }, [recipes, search])

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
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent transition-colors duration-100 text-left"
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
                        {/* ── Delete this block if macros feel noisy ── */}
                        <p className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                          <span className="flex items-center gap-0.5">
                            <Flame className="h-3 w-3" />
                            {perPortion.kcal} kcal
                          </span>
                          <span>{perPortion.protein}g protein</span>
                        </p>
                        {/* ── End deletable macros block ── */}
                      </div>
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