"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, ArrowRight, Check } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Recipe, Ingredient, Macros, EMPTY_MACROS } from "@/lib/types"
import { saveRecipeAndRevalidate } from "@/hooks/use-recipes"
import { StepIngredients } from "./step-ingredients"
import { StepInstructions } from "./step-instructions"
import { StepImage } from "./step-image"
import { StepMacros } from "./step-macros"
import { StepTags } from "./step-tags"

const STEP_LABELS = ["Ingredients", "Instructions", "Image", "Macros", "Tags"]

interface RecipeFormProps {
  mode: "create" | "edit"
  initialData?: Recipe
}

export function RecipeForm({ mode, initialData }: RecipeFormProps) {
  const router = useRouter()
  const [step, setStep] = useState(0)

  const isEdit = mode === "edit"

  // Step 1
  const [title, setTitle] = useState(initialData?.title ?? "")
  const [portions, setPortions] = useState(initialData?.portions ?? 1)
  const [ingredients, setIngredients] = useState<Ingredient[]>(
    initialData?.ingredients.length
      ? initialData.ingredients
      : [{ id: crypto.randomUUID(), name: "", amount: "", macros: null }]
  )

  // Step 2
  const [steps, setSteps] = useState<string[]>(
    initialData?.steps.length ? initialData.steps : [""]
  )

  // Step 3
  const [image, setImage] = useState<string | null>(
    initialData?.image ?? null
  )

  // Step 4
  const [macroMode, setMacroMode] = useState<"auto" | "manual">(
    initialData?.macroMode ?? "auto"
  )
  const [manualMacros, setManualMacros] = useState<Macros>(
    initialData?.macroMode === "manual"
      ? { ...initialData.macros }
      : { ...EMPTY_MACROS }
  )

  // Step 5
  const [tags, setTags] = useState<string[]>(initialData?.tags ?? [])

  function calcAutoMacros(): Macros {
    return ingredients.reduce(
      (acc, ing) => {
        if (!ing.macros) return acc
        return {
          kcal: acc.kcal + ing.macros.kcal,
          carbs: acc.carbs + ing.macros.carbs,
          fat: acc.fat + ing.macros.fat,
          protein: acc.protein + ing.macros.protein,
        }
      },
      { ...EMPTY_MACROS }
    )
  }

  async function handleSave() {
    if (!title.trim()) {
      toast.error("Please enter a recipe title")
      setStep(0)
      return
    }

    const recipe: Recipe = {
      id: initialData?.id ?? crypto.randomUUID(),
      title: title.trim(),
      portions: Math.max(1, portions),
      ingredients: ingredients.filter((i) => i.name.trim()),
      steps: steps.filter((s) => s.trim()),
      image,
      macros: macroMode === "auto" ? calcAutoMacros() : manualMacros,
      macroMode,
      tags,
      rating: initialData?.rating ?? null,
      createdAt: initialData?.createdAt ?? Date.now(),
      isFavorite: initialData?.isFavorite ?? false,
    }

    await saveRecipeAndRevalidate(recipe)
    toast.success(isEdit ? "Recipe updated!" : "Recipe saved!")
    router.push(isEdit ? `/recipe/${recipe.id}` : "/")
  }

  const totalSteps = STEP_LABELS.length
  const isLast = step === totalSteps - 1

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-0">
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <Link
              href={isEdit ? `/recipe/${initialData!.id}` : "/"}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </Link>
            <h1 className="text-sm font-semibold text-foreground">
              {isEdit ? "Edit Recipe" : "New Recipe"}
            </h1>
            <div className="w-12" />
          </div>

          <div className="flex gap-1.5">
            {STEP_LABELS.map((label, i) => (
              <button
                key={label}
                onClick={() => setStep(i)}
                className="flex-1 group"
                aria-label={`Go to ${label}`}
              >
                <div
                  className={`h-1 rounded-full transition-colors duration-200 ${
                    i <= step ? "bg-primary" : "bg-border"
                  }`}
                />
                <span
                  className={`text-[10px] mt-1 block text-center transition-colors ${
                    i === step
                      ? "text-primary font-medium"
                      : "text-muted-foreground"
                  }`}
                >
                  {label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 pb-28">
        {step === 0 && (
          <StepIngredients
            title={title}
            setTitle={setTitle}
            portions={portions}
            setPortions={setPortions}
            ingredients={ingredients}
            setIngredients={setIngredients}
          />
        )}
        {step === 1 && <StepInstructions steps={steps} setSteps={setSteps} />}
        {step === 2 && <StepImage image={image} setImage={setImage} />}
        {step === 3 && (
          <StepMacros
            macroMode={macroMode}
            setMacroMode={setMacroMode}
            macros={manualMacros}
            setMacros={setManualMacros}
            ingredients={ingredients}
            portions={portions}
          />
        )}
        {step === 4 && <StepTags tags={tags} setTags={setTags} />}
      </main>

      <div className="fixed bottom-16 lg:bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border z-30">
        <div className="max-w-2xl mx-auto px-4 py-3 flex gap-3 lg:pl-60">
          {step > 0 && (
            <Button
              variant="outline"
              onClick={() => setStep(step - 1)}
              className="flex-1"
            >
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              Back
            </Button>
          )}
          {isLast ? (
            <Button onClick={handleSave} className="flex-1">
              <Check className="h-4 w-4 mr-1.5" />
              {isEdit ? "Update Recipe" : "Save Recipe"}
            </Button>
          ) : (
            <Button onClick={() => setStep(step + 1)} className="flex-1">
              Next
              <ArrowRight className="h-4 w-4 ml-1.5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}