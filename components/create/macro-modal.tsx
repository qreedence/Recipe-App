"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Macros, EMPTY_MACROS } from "@/lib/types"

interface MacroModalProps {
  open: boolean
  onClose: () => void
  ingredientName: string
  initialMacros: Macros | null
  onSave: (macros: Macros) => void
}

export function MacroModal({
  open,
  onClose,
  ingredientName,
  initialMacros,
  onSave,
}: MacroModalProps) {
  const [macros, setMacros] = useState<Macros>(initialMacros ?? { ...EMPTY_MACROS })

  useEffect(() => {
    if (open) {
      setMacros(initialMacros ?? { ...EMPTY_MACROS })
    }
  }, [open, initialMacros])

  function handleChange(key: keyof Macros, value: string) {
    const num = value === "" ? 0 : parseFloat(value)
    if (!isNaN(num)) {
      setMacros((prev) => ({ ...prev, [key]: num }))
    }
  }

  function handleSave() {
    onSave(macros)
    onClose()
  }

  const fields: { key: keyof Macros; label: string; unit: string }[] = [
    { key: "kcal", label: "Calories", unit: "kcal" },
    { key: "carbs", label: "Carbs", unit: "g" },
    { key: "protein", label: "Protein", unit: "g" },
    { key: "fat", label: "Fat", unit: "g" },
  ]

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-base">
            Macros for {ingredientName || "ingredient"}
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3 py-2">
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
                  onChange={(e) => handleChange(key, e.target.value)}
                  onFocus={(e) => {
                    setTimeout(() => {
                      e.target.scrollIntoView({
                        behavior: "smooth",
                        block: "center",
                      });
                    }, 300);
                  }}
                  placeholder="0"
                  className="pr-12"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  {unit}
                </span>
              </div>
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
