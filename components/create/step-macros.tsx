"use client"

import { Input } from "@/components/ui/input"
import { Macros, Ingredient, EMPTY_MACROS } from "@/lib/types"

interface StepMacrosProps {
  macroMode: "auto" | "manual"
  setMacroMode: (v: "auto" | "manual") => void
  macros: Macros
  setMacros: (v: Macros) => void
  ingredients: Ingredient[]
  portions: number
}

function calcAutoMacros(ingredients: Ingredient[]): Macros {
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

export function StepMacros({
  macroMode,
  setMacroMode,
  macros,
  setMacros,
  ingredients,
  portions,
}: StepMacrosProps) {
  const autoMacros = calcAutoMacros(ingredients)
  const displayMacros = macroMode === "auto" ? autoMacros : macros
  const hasIngredientMacros = ingredients.some((i) => i.macros !== null)

  const perPortion = {
    kcal: portions > 0 ? Math.round(displayMacros.kcal / portions) : 0,
    carbs: portions > 0 ? Math.round(displayMacros.carbs / portions) : 0,
    fat: portions > 0 ? Math.round(displayMacros.fat / portions) : 0,
    protein: portions > 0 ? Math.round(displayMacros.protein / portions) : 0,
  }

  function handleManualChange(key: keyof Macros, value: string) {
    const num = value === "" ? 0 : parseFloat(value)
    if (!isNaN(num)) {
      setMacros({ ...macros, [key]: num })
    }
  }

  const fields: { key: keyof Macros; label: string; unit: string }[] = [
    { key: "kcal", label: "Calories", unit: "kcal" },
    { key: "protein", label: "Protein", unit: "g" },
    { key: "carbs", label: "Carbs", unit: "g" },
    { key: "fat", label: "Fat", unit: "g" },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-sm font-medium text-foreground mb-1">Macros</h2>
        <p className="text-xs text-muted-foreground">
          Choose to calculate from ingredients or enter totals manually.
        </p>
      </div>

      {/* Mode toggle */}
      <div className="flex rounded-lg border border-border overflow-hidden">
        <button
          onClick={() => setMacroMode("auto")}
          className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
            macroMode === "auto"
              ? "bg-primary text-primary-foreground"
              : "bg-card text-muted-foreground hover:text-foreground"
          }`}
        >
          Auto (from ingredients)
        </button>
        <button
          onClick={() => setMacroMode("manual")}
          className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
            macroMode === "manual"
              ? "bg-primary text-primary-foreground"
              : "bg-card text-muted-foreground hover:text-foreground"
          }`}
        >
          Manual Entry
        </button>
      </div>

      {macroMode === "auto" ? (
        <>
          {!hasIngredientMacros ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              No ingredient macros entered yet. Go back to Step 1 to add macros to
              your ingredients.
            </p>
          ) : (
            <div className="bg-muted rounded-xl p-5">
              <p className="text-xs text-muted-foreground mb-4">
                Calculated from {ingredients.filter((i) => i.macros).length} ingredients
                {portions > 1 ? ` / ${portions} portions` : ""}
              </p>
              <div className="grid grid-cols-2 gap-4">
                {fields.map(({ key, label, unit }) => (
                  <div
                    key={key}
                    className="bg-card rounded-lg p-3 border border-border"
                  >
                    <div className="text-xs text-muted-foreground">{label}</div>
                    <div className="text-xl font-bold text-foreground mt-0.5">
                      {perPortion[key]}
                      <span className="text-xs font-normal text-muted-foreground ml-1">
                        {unit}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      per portion
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col gap-4">
          <p className="text-xs text-muted-foreground">
            Enter total macros for the entire recipe (all portions combined).
          </p>
          {fields.map(({ key, label, unit }) => (
            <div key={key} className="flex items-center gap-3">
              <label className="text-sm text-muted-foreground w-20 shrink-0">
                {label}
              </label>
              <div className="relative flex-1">
                <Input
                  type="number"
                  min="0"
                  step="any"
                  value={macros[key] || ""}
                  onChange={(e) => handleManualChange(key, e.target.value)}
                  placeholder="0"
                  className="pr-12"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  {unit}
                </span>
              </div>
            </div>
          ))}
          {portions > 1 && (
            <div className="bg-muted rounded-lg p-3 mt-1">
              <p className="text-xs text-muted-foreground mb-2">Per portion:</p>
              <div className="flex gap-4">
                {fields.map(({ key, label, unit }) => (
                  <div key={key} className="text-center">
                    <div className="text-sm font-bold text-foreground">
                      {perPortion[key]}
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
        </div>
      )}
    </div>
  )
}
