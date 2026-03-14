'use client'

import { useState } from 'react'
import { Trash2, ShoppingCart, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import type { AggregatedIngredient } from '@/lib/aggregate-ingredients'

function formatQuantity(qty: number): string {
  const rounded = Math.round(qty * 100) / 100
  return rounded % 1 === 0 ? String(rounded) : rounded.toFixed(2).replace(/0+$/, '')
}

function formatDisplay(ing: AggregatedIngredient): string {
  if (ing.totalQuantity === null) return ing.unit ? `? ${ing.unit}` : '?'

  // Upscale for display: g -> kg, ml -> l
  let qty = ing.totalQuantity
  let unit = ing.unit

  if (unit === 'g' && qty >= 1000) {
    qty = qty / 1000
    unit = 'kg'
  } else if (unit === 'ml' && qty >= 1000) {
    qty = qty / 1000
    unit = 'l'
  }

  return unit ? `${formatQuantity(qty)} ${unit}` : formatQuantity(qty)
}

interface AggregatedIngredientsModalProps {
  open: boolean
  onClose: () => void
  ingredients: AggregatedIngredient[]
  loading?: boolean
}

export function AggregatedIngredientsModal({
  open,
  onClose,
  ingredients,
  loading = false,
}: AggregatedIngredientsModalProps) {
  const [removed, setRemoved] = useState<Set<string>>(new Set())

  const visible = ingredients.filter((ing) => !removed.has(`${ing.name}::${ing.unit}`))

  function handleRemove(ing: AggregatedIngredient) {
    setRemoved((prev) => new Set(prev).add(`${ing.name}::${ing.unit}`))
  }

  function handleOpenChange(isOpen: boolean) {
    if (!isOpen) {
      setRemoved(new Set())
      onClose()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md p-0 gap-0">
        <DialogHeader className="px-4 pt-4 pb-3">
          <DialogTitle className="text-base">Shopping List Preview</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {visible.length} ingredients from your meal plan
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto max-h-[50vh] px-4 pb-3">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : visible.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-10">
              No ingredients to show
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {visible.map((ing) => (
                <li key={`${ing.name}::${ing.unit}`} className="flex items-center gap-3 py-2.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{ing.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDisplay(ing)}
                      {ing.sources.length > 1 && (
                        <span className="ml-1">
                          · {ing.sources.map((s) => s.recipeTitle).join(', ')}
                        </span>
                      )}
                    </p>
                    {ing.totalQuantity === null && (
                      <p className="text-xs text-amber-600">Quantity unknown — check recipe</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleRemove(ing)}
                    className="p-2 rounded-lg text-muted-foreground hover:text-destructive transition-colors shrink-0"
                    aria-label={`Remove ${ing.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="px-4 py-3 border-t border-border">
          <Button className="w-full" disabled={visible.length === 0 || loading}>
            <ShoppingCart className="h-4 w-4 mr-2" />
            Add to Shopping List
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
