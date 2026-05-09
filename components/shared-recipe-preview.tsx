'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Drumstick, Flame, Beef, Wheat, Droplets, BookmarkPlus, Check } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useUser } from '@/hooks/use-user'
import { saveRecipeAndRevalidate } from '@/hooks/use-recipes'
import type { Recipe, Macros, Ingredient } from '@/lib/types'

interface SharedRecipePreviewProps {
  recipe: {
    id: string
    title: string
    portions: number
    is_favorite: boolean
    ingredients: Ingredient[]
    steps: string[]
    image: string | null
    macros: Macros
    macro_mode: 'auto' | 'manual'
    tags: string[]
    rating: number | null
    created_at: number
  }
}

export function SharedRecipePreview({ recipe: snapshot }: SharedRecipePreviewProps) {
  const router = useRouter()
  const { user } = useUser()
  const [saved, setSaved] = useState(false)
  const [showLeaveDialog, setShowLeaveDialog] = useState(false)
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null)

  const recipe: Recipe = {
    id: crypto.randomUUID(),
    title: snapshot.title,
    portions: snapshot.portions,
    isFavorite: false,
    ingredients: snapshot.ingredients,
    steps: snapshot.steps,
    image: snapshot.image,
    macros: snapshot.macros,
    macroMode: snapshot.macro_mode,
    tags: snapshot.tags,
    rating: null,
    createdAt: Date.now(),
  }

  const perPortion = {
    kcal: recipe.portions > 0 ? Math.round(recipe.macros.kcal / recipe.portions) : 0,
    protein: recipe.portions > 0 ? Math.round(recipe.macros.protein / recipe.portions) : 0,
    carbs: recipe.portions > 0 ? Math.round(recipe.macros.carbs / recipe.portions) : 0,
    fat: recipe.portions > 0 ? Math.round(recipe.macros.fat / recipe.portions) : 0,
  }

  const macroPills = [
    { label: 'Calories', value: perPortion.kcal, unit: 'kcal', icon: Flame, color: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300' },
    { label: 'Protein', value: perPortion.protein, unit: 'g', icon: Beef, color: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300' },
    { label: 'Carbs', value: perPortion.carbs, unit: 'g', icon: Wheat, color: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300' },
    { label: 'Fat', value: perPortion.fat, unit: 'g', icon: Droplets, color: 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300' },
  ]

  async function handleSave() {
    if (!user) {
      router.push(`/login?redirectTo=${encodeURIComponent(window.location.pathname)}`)
      return
    }
    await saveRecipeAndRevalidate(recipe)
    setSaved(true)
    toast.success('Recipe saved to your collection!')
  }

  function handleNavigate(href: string) {
    if (!saved) {
      setPendingNavigation(href)
      setShowLeaveDialog(true)
      return
    }
    router.push(href)
  }

  function confirmLeave() {
    setShowLeaveDialog(false)
    if (pendingNavigation) router.push(pendingNavigation)
  }

  return (
    <div className="min-h-screen bg-background pb-6">
      <div className="relative">
        {snapshot.image ? (
          <div className="aspect-16/10 sm:aspect-16/7 bg-muted">
            <img src={snapshot.image} alt={snapshot.title} className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="aspect-16/10 sm:aspect-16/7 bg-muted flex items-center justify-center">
            <Drumstick className="h-16 w-16 text-muted-foreground" />
          </div>
        )}

        <button
          onClick={() => handleNavigate('/')}
          className="absolute top-4 left-4 p-2 rounded-full bg-foreground/50 text-background hover:bg-foreground/70 transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
      </div>

      <div className="max-w-2xl mx-auto px-4 -mt-6 relative z-10">
        <div className="bg-card rounded-xl border border-border p-5 mb-4">
          <p className="text-xs font-medium text-orange-500 uppercase tracking-wider mb-2">
            Shared recipe
          </p>
          <h1 className="text-xl font-bold text-card-foreground text-balance">
            {snapshot.title}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {snapshot.portions} {snapshot.portions === 1 ? 'portion' : 'portions'}
          </p>

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
                <span className="text-[10px] leading-none opacity-80">{label}</span>
              </div>
            ))}
          </div>

          {snapshot.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-4">
              {snapshot.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground text-xs font-medium"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="mt-5">
            {saved ? (
              <Button disabled className="w-full">
                <Check className="h-4 w-4 mr-1.5" />
                Saved to your recipes
              </Button>
            ) : (
              <Button onClick={handleSave} className="w-full bg-gradient-to-r from-orange-500 to-orange-400 hover:from-orange-600 hover:to-orange-500">
                <BookmarkPlus className="h-4 w-4 mr-1.5" />
                {user ? 'Save to my recipes' : 'Sign in to save'}
              </Button>
            )}
          </div>
        </div>

        {snapshot.ingredients.length > 0 && (
          <section className="mb-6">
            <h2 className="text-base font-semibold text-foreground mb-3">Ingredients</h2>
            <div className="bg-card rounded-xl border border-border divide-y divide-border">
              {snapshot.ingredients.map((ing) => (
                <div key={ing.id} className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm text-card-foreground">{ing.name}</span>
                  <span className="text-sm text-muted-foreground shrink-0 ml-4">
                    {ing.quantity != null ? `${ing.quantity} ${ing.unit}` : ing.unit}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {snapshot.steps.length > 0 && (
          <section className="mb-10">
            <h2 className="text-base font-semibold text-foreground mb-3">Instructions</h2>
            <div className="flex flex-col gap-4">
              {snapshot.steps.map((s, i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    {i + 1}
                  </div>
                  <p className="text-sm text-foreground leading-relaxed pt-1">{s}</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      <AlertDialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave without saving?</AlertDialogTitle>
            <AlertDialogDescription>
              You haven&apos;t saved this recipe yet. If you leave now, you&apos;ll need the share link to find it again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Stay</AlertDialogCancel>
            <AlertDialogAction onClick={confirmLeave}>Leave</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
