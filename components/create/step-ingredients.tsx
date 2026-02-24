"use client"

import { useState } from "react"
import { Plus, Trash2, FlaskConical, Flame } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Ingredient, Macros, EMPTY_MACROS } from "@/lib/types"
import { MacroModal } from "./macro-modal"

interface StepIngredientsProps {
  title: string
  setTitle: (v: string) => void
  portions: number
  setPortions: (v: number) => void
  ingredients: Ingredient[]
  setIngredients: (v: Ingredient[]) => void
}

export function StepIngredients({
  title,
  setTitle,
  portions,
  setPortions,
  ingredients,
  setIngredients,
}: StepIngredientsProps) {
  const [macroModalIndex, setMacroModalIndex] = useState<number | null>(null)

  function addIngredient() {
    setIngredients([
      ...ingredients,
      { id: crypto.randomUUID(), name: "", amount: "", macros: null },
    ])
  }

  function updateIngredient(index: number, field: keyof Ingredient, value: string) {
    const updated = [...ingredients]
    updated[index] = { ...updated[index], [field]: value }
    setIngredients(updated)
  }

  function removeIngredient(index: number) {
    setIngredients(ingredients.filter((_, i) => i !== index))
  }

  function saveMacros(index: number, macros: Macros) {
    const updated = [...ingredients]
    updated[index] = { ...updated[index], macros }
    setIngredients(updated)
  }

  const totalMacros = ingredients.reduce(
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

  const perPortion = {
    kcal: portions > 0 ? Math.round(totalMacros.kcal / portions) : 0,
    carbs: portions > 0 ? Math.round(totalMacros.carbs / portions) : 0,
    fat: portions > 0 ? Math.round(totalMacros.fat / portions) : 0,
    protein: portions > 0 ? Math.round(totalMacros.protein / portions) : 0,
  }

  const hasAnyMacros = ingredients.some((i) => i.macros !== null)

  return (
    <div className="flex flex-col gap-6">
      {/* Title */}
      <div>
        <label className="text-sm font-medium text-foreground mb-1.5 block">
          Recipe Title
        </label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Chicken Stir Fry"
          className="h-11"
        />
      </div>

      {/* Portions */}
      <div>
        <label className="text-sm font-medium text-foreground mb-1.5 block">
          Number of Portions
        </label>
        <Input
          type="number"
          min="1"
          value={portions || ""}
          onChange={(e) => setPortions(parseInt(e.target.value) || 0)}
          placeholder="e.g. 4"
          className="h-11 w-32"
        />
      </div>

      {/* Ingredients */}
      <div>
        <label className="text-sm font-medium text-foreground mb-3 block">
          Ingredients
        </label>
        <div className="flex flex-col gap-2">
          {ingredients.map((ing, i) => (
            <div key={ing.id} className="flex items-center gap-2">
              <Input
                value={ing.amount}
                onChange={(e) => updateIngredient(i, "amount", e.target.value)}
                placeholder="Amount"
                className="w-24 shrink-0"
              />
              <Input
                value={ing.name}
                onChange={(e) => updateIngredient(i, "name", e.target.value)}
                placeholder="Ingredient name"
                className="flex-1"
              />
              <button
                onClick={() => setMacroModalIndex(i)}
                className={`p-2 rounded-lg border transition-colors shrink-0 ${
                  ing.macros
                    ? "bg-primary/10 border-primary/30 text-primary"
                    : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/20"
                }`}
                aria-label={`Set macros for ${ing.name || "ingredient"}`}
              >
                <FlaskConical className="h-4 w-4" />
              </button>
              <button
                onClick={() => removeIngredient(i)}
                className="p-2 rounded-lg text-muted-foreground hover:text-destructive transition-colors shrink-0"
                aria-label={`Remove ${ing.name || "ingredient"}`}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={addIngredient}
          className="mt-3"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Ingredient
        </Button>
      </div>

      {/* Running macro totals */}
      {hasAnyMacros && (
        <div className="bg-muted rounded-xl p-4">
          <div className="flex items-center gap-1.5 mb-3">
            <Flame className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-foreground">
              Per Portion
            </span>
            <span className="text-xs text-muted-foreground ml-auto">
              Total across {ingredients.filter((i) => i.macros).length} ingredients
            </span>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {(
              [
                { label: "Calories", value: perPortion.kcal, unit: "kcal" },
                { label: "Protein", value: perPortion.protein, unit: "g" },
                { label: "Carbs", value: perPortion.carbs, unit: "g" },
                { label: "Fat", value: perPortion.fat, unit: "g" },
              ] as const
            ).map(({ label, value, unit }) => (
              <div key={label} className="text-center">
                <div className="text-lg font-bold text-foreground">
                  {value}
                  <span className="text-xs font-normal text-muted-foreground ml-0.5">
                    {unit}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">{label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Macro modal */}
      {macroModalIndex !== null && (
        <MacroModal
          open={true}
          onClose={() => setMacroModalIndex(null)}
          ingredientName={ingredients[macroModalIndex]?.name || ""}
          initialMacros={ingredients[macroModalIndex]?.macros ?? null}
          onSave={(macros) => saveMacros(macroModalIndex, macros)}
        />
      )}
    </div>
  )
}
