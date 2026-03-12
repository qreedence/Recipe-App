'use client'

import { useState } from 'react'
import { useIsMobile } from '@/hooks/use-mobile'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { ALL_MEAL_TYPES, MealType } from '@/lib/types'

interface MealTypeToggleProps {
  dayIndex: number
  dayLabel: string
  enabledTypes: MealType[]
  onToggle: (dayIndex: number, types: MealType[]) => void
  hasRecipe: (mealType: MealType) => boolean
  onRemoveEntry: (mealType: MealType) => void
  children: React.ReactNode
}

function MealTypeCheckboxList({
  enabledTypes,
  onToggle,
}: {
  enabledTypes: MealType[]
  onToggle: (type: MealType, checked: boolean) => void
}) {
  return (
    <div className="flex flex-col gap-3">
      {ALL_MEAL_TYPES.map((type) => {
        const checked = enabledTypes.includes(type)
        return (
          <label key={type} className="flex items-center gap-3 cursor-pointer">
            <Checkbox
              checked={checked}
              onCheckedChange={(val) => onToggle(type, val === true)}
              disabled={checked && enabledTypes.length === 1}
            />
            <span className="text-sm font-medium">{type}</span>
          </label>
        )
      })}
    </div>
  )
}

export function MealTypeToggle({
  dayIndex,
  dayLabel,
  enabledTypes,
  onToggle,
  children,
  hasRecipe,
  onRemoveEntry,
}: MealTypeToggleProps) {
  const [open, setOpen] = useState(false)
  const [pendingRemove, setPendingRemove] = useState<MealType | null>(null)
  const isMobile = useIsMobile()

  function handleToggle(type: MealType, checked: boolean) {
    if (checked) {
      onToggle(dayIndex, [...enabledTypes, type])
      return
    }

    if (hasRecipe(type)) {
      setPendingRemove(type)
      return
    }

    onToggle(
      dayIndex,
      enabledTypes.filter((t) => t !== type),
    )
  }

  function confirmRemove() {
    if (!pendingRemove) return
    onRemoveEntry(pendingRemove)
    onToggle(
      dayIndex,
      enabledTypes.filter((t) => t !== pendingRemove),
    )
    setPendingRemove(null)
  }

  if (isMobile) {
    return (
      <>
        <button onClick={() => setOpen(true)}>{children}</button>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent side="bottom">
            <SheetHeader>
              <SheetTitle>{dayLabel}</SheetTitle>
              <SheetDescription>Choose which meals to plan for this day.</SheetDescription>
            </SheetHeader>
            <div className="px-4 pb-6">
              <MealTypeCheckboxList enabledTypes={enabledTypes} onToggle={handleToggle} />
            </div>
          </SheetContent>
        </Sheet>
        <Dialog
          open={pendingRemove !== null}
          onOpenChange={(open) => !open && setPendingRemove(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Remove planned meal?</DialogTitle>
              <DialogDescription>
                You have a recipe planned for {pendingRemove?.toLowerCase()}. Removing this meal
                type will delete it.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setPendingRemove(null)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={confirmRemove}>
                Remove
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    )
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-48">
        <p className="text-sm font-semibold mb-3">Meals</p>
        <MealTypeCheckboxList enabledTypes={enabledTypes} onToggle={handleToggle} />
      </PopoverContent>
      <Dialog
        open={pendingRemove !== null}
        onOpenChange={(open) => !open && setPendingRemove(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove planned meal?</DialogTitle>
            <DialogDescription>
              You have a recipe planned for {pendingRemove?.toLowerCase()}. Removing this meal type
              will delete it.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingRemove(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmRemove}>
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Popover>
  )
}
