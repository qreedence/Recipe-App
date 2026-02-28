"use client"

import Link from "next/link"
import { Flame, Drumstick } from "lucide-react"
import { Recipe } from "@/lib/types"
import { StarRating } from "@/components/star-rating"
import { FavoriteButton } from "./favorites-button"

interface RecipeCardProps {
  recipe: Recipe
}

export function RecipeCard({ recipe }: RecipeCardProps) {
  const perPortion = {
    kcal: recipe.portions > 0 ? Math.round(recipe.macros.kcal / recipe.portions) : 0,
    protein: recipe.portions > 0 ? Math.round(recipe.macros.protein / recipe.portions) : 0,
  }

  return (
    <Link href={`/recipe/${recipe.id}`} className="group block">
      <div className="overflow-hidden rounded-xl bg-card border border-border">
        <div className="aspect-[4/3] bg-muted relative overflow-hidden">
          {recipe.image ? (
            <img
              src={recipe.image}
              alt={recipe.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              <Drumstick className="h-10 w-10" />
            </div>
          )}
        </div>
        <div className="p-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm text-card-foreground leading-tight line-clamp-2 text-balance">
              {recipe.title}
            </h3>
              {recipe.isFavorite && (
                <FavoriteButton isFavorite size="sm" readOnly />
              )}
          </div>
          {recipe.rating !== null && recipe.rating > 0 && (
            <div className="mt-1">
              <StarRating value={recipe.rating} size="sm" readOnly />
            </div>
          )}
          <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Flame className="h-3 w-3" />
              {perPortion.kcal} kcal
            </span>
            <span>{perPortion.protein}g protein</span>
          </div>
        </div>
      </div>
    </Link>
  )
}
