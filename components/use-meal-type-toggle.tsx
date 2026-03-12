"use client"

import { useState } from "react"
import { useIsMobile } from "@/hooks/use-mobile"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Checkbox } from "@/components/ui/checkbox"
import { ALL_MEAL_TYPES, MealType } from "@/lib/types"

interface MealTypeToggleProps {
  dayIndex: number
  dayLabel: string
  enabledTypes: MealType[]
  onToggle: (dayIndex: number, types: MealType[]) => void
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
          <label
            key={type}
            className="flex items-center gap-3 cursor-pointer"
          >
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
}: MealTypeToggleProps) {
  const [open, setOpen] = useState(false)
  const isMobile = useIsMobile()

  function handleToggle(type: MealType, checked: boolean) {
    const next = checked
      ? [...enabledTypes, type]
      : enabledTypes.filter((t) => t !== type)
    onToggle(dayIndex, next)
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
              <MealTypeCheckboxList
                enabledTypes={enabledTypes}
                onToggle={handleToggle}
              />
            </div>
          </SheetContent>
        </Sheet>
      </>
    )
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-48">
        <p className="text-sm font-semibold mb-3">Meals</p>
        <MealTypeCheckboxList
          enabledTypes={enabledTypes}
          onToggle={handleToggle}
        />
      </PopoverContent>
    </Popover>
  )
}