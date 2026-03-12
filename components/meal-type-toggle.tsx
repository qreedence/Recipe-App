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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
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
        <AlertDialog
          open={pendingRemove !== null}
          onOpenChange={(open) => !open && setPendingRemove(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader className="text-center sm:text-center">
              <AlertDialogTitle>Remove planned meal?</AlertDialogTitle>
              <AlertDialogDescription>
                You have a recipe planned for {pendingRemove?.toLowerCase()}. Removing this meal
                type will delete it.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-row justify-center items-center sm:justify-center">
              <AlertDialogCancel onClick={() => setPendingRemove(null)}>
                Keep meal
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmRemove}
                className="p-1.5 rounded-md text-muted-foreground/40 text-destructive bg-destructive/10 hover:bg-destructive/20 transition-colors duration-150"
              >
                Remove
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
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
      <AlertDialog
        open={pendingRemove !== null}
        onOpenChange={(open) => !open && setPendingRemove(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader className="text-center sm:text-center">
            <AlertDialogTitle>Remove planned meal?</AlertDialogTitle>
            <AlertDialogDescription>
              You have a recipe planned for {pendingRemove?.toLowerCase()}. Removing this meal type
              will delete it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row justify-center items-center sm:justify-center">
            <AlertDialogCancel onClick={() => setPendingRemove(null)}>Keep meal</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRemove}
              className="px-4 py-2 rounded-md text-destructive bg-destructive/10 hover:bg-destructive/20 transition-colors duration-150"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Popover>
  )
}
