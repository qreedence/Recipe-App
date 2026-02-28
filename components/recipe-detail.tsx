"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Trash2,
  Flame,
  Drumstick,
  Beef,
  Wheat,
  Droplets,
} from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useRecipe, deleteRecipeAndRevalidate, updateRecipeAndRevalidate } from "@/hooks/use-recipes"
import { StarRating } from "@/components/star-rating"

interface RecipeDetailProps {
  id: string
}

export function RecipeDetail({ id }: RecipeDetailProps) {
  const router = useRouter()
  const { recipe, isLoading } = useRecipe(id)

  if (isLoading) return null

  if (!recipe) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-foreground mb-1">
            Recipe not found
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            This recipe may have been deleted.
          </p>
          <Link
            href="/"
            className="text-sm text-primary font-medium hover:underline"
          >
            Back to recipes
          </Link>
        </div>
      </div>
    )
  }

  const perPortion = {
    kcal:
      recipe.portions > 0
        ? Math.round(recipe.macros.kcal / recipe.portions)
        : 0,
    protein:
      recipe.portions > 0
        ? Math.round(recipe.macros.protein / recipe.portions)
        : 0,
    carbs:
      recipe.portions > 0
        ? Math.round(recipe.macros.carbs / recipe.portions)
        : 0,
    fat:
      recipe.portions > 0
        ? Math.round(recipe.macros.fat / recipe.portions)
        : 0,
  }

  const macroPills = [
    {
      label: "Calories",
      value: perPortion.kcal,
      unit: "kcal",
      icon: Flame,
      color: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
    },
    {
      label: "Protein",
      value: perPortion.protein,
      unit: "g",
      icon: Beef,
      color: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
    },
    {
      label: "Carbs",
      value: perPortion.carbs,
      unit: "g",
      icon: Wheat,
      color: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
    },
    {
      label: "Fat",
      value: perPortion.fat,
      unit: "g",
      icon: Droplets,
      color: "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
    },
  ]

  async function handleRating(newRating: number) {
    await updateRecipeAndRevalidate(recipe!.id, {
      rating: newRating || null,
    })
  }

  async function handleFavorite() {
    await updateRecipeAndRevalidate(recipe!.id, {
      isFavorite: !recipe!.isFavorite,
    })
  }

  async function handleDelete() {
    await deleteRecipeAndRevalidate(recipe!.id)
    router.push("/")
  }

  return (
    <div className="min-h-screen bg-background pb-6">
      {/* Hero image */}
      <div className="relative">
        {recipe.image ? (
          <div className="aspect-[16/10] sm:aspect-[16/7] bg-muted">
            <img
              src={recipe.image}
              alt={recipe.title}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="aspect-[16/10] sm:aspect-[16/7] bg-muted flex items-center justify-center">
            <Drumstick className="h-16 w-16 text-muted-foreground" />
          </div>
        )}

        {/* Back button overlay */}
        <Link
          href="/"
          className="absolute top-4 left-4 p-2 rounded-full bg-foreground/50 text-background hover:bg-foreground/70 transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 -mt-6 relative z-10">
        {/* Title card */}
        <div className="bg-card rounded-xl border border-border p-5 mb-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold text-card-foreground text-balance">
                {recipe.title}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {recipe.portions} {recipe.portions === 1 ? "portion" : "portions"}
              </p>
              <div className="mt-2">
                <StarRating value={recipe.rating} onChange={handleRating} />
              </div>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button
                  className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
                  aria-label="Delete recipe"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete recipe?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete &ldquo;{recipe.title}&rdquo;. This
                    action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          {/* Macro pills */}
          <div className="grid grid-cols-4 gap-2 mt-4">
            {macroPills.map(({ label, value, unit, icon: Icon, color }) => (
              <div
                key={label}
                className={`flex flex-col items-center gap-1 rounded-lg py-2.5 px-2 ${color}`}
              >
                <Icon className="h-4 w-4" />
                <span className="text-sm font-bold leading-none">
                  {value}
                  <span className="text-xs font-normal ml-0.5">{unit}</span>
                </span>
                <span className="text-[10px] leading-none opacity-80">
                  {label}
                </span>
              </div>
            ))}
          </div>

          {/* Tags */}
          {recipe.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-4">
              {recipe.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground text-xs font-medium"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Ingredients */}
        {recipe.ingredients.length > 0 && (
          <section className="mb-6">
            <h2 className="text-base font-semibold text-foreground mb-3">
              Ingredients
            </h2>
            <div className="bg-card rounded-xl border border-border divide-y divide-border">
              {recipe.ingredients.map((ing) => (
                <div
                  key={ing.id}
                  className="flex items-center justify-between px-4 py-3"
                >
                  <span className="text-sm text-card-foreground">{ing.name}</span>
                  <span className="text-sm text-muted-foreground shrink-0 ml-4">
                    {ing.amount}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Steps */}
        {recipe.steps.length > 0 && (
          <section className="mb-10">
            <h2 className="text-base font-semibold text-foreground mb-3">
              Instructions
            </h2>
            <div className="flex flex-col gap-4">
              {recipe.steps.map((s, i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    {i + 1}
                  </div>
                  <p className="text-sm text-foreground leading-relaxed pt-1">
                    {s}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
