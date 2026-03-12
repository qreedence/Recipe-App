"use client"

import { useState, useMemo, useEffect } from "react"
import { ChevronLeft, ChevronRight, Plus, X, Flame } from "lucide-react"
import { useSwipeable } from "react-swipeable"
import { RecipePickerModal, PickedRecipe } from "./recipe-picker-modal"
import { useMealPlan } from "@/hooks/use-meal-plan"
import type { MealPlanEntry } from "@/lib/types"

const MEAL_TYPES = ["Lunch", "Dinner"] as const
type MealType = (typeof MEAL_TYPES)[number]
const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const

type MealSlot = {
  dayIndex: number
  mealType: MealType
}

function getWeekDates(): Date[] {
  const today = new Date()
  const day = today.getDay()
  const mondayOffset = day === 0 ? -6 : 1 - day
  const monday = new Date(today)
  monday.setDate(today.getDate() + mondayOffset)

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })
}

function toDateString(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

function isToday(date: Date): boolean {
  const now = new Date()
  return (
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()
  )
}

function formatDayHeader(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  })
}

// Slot components

function EmptySlot({ mealType, onClick }: { mealType: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 border-dashed border-border hover:border-primary/40 hover:bg-primary/5 transition-colors duration-150 cursor-pointer"
      aria-label={`Add ${mealType}`}
    >
      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
        <Plus className="h-4 w-4 text-muted-foreground" />
      </div>
      <span className="text-xs text-muted-foreground">Add {mealType}</span>
    </button>
  )
}

function FilledSlot({
  entry,
  onRemove,
}: {
  entry: MealPlanEntry
  onRemove: () => void
}) {
  const perPortion = {
    kcal: Math.round(entry.recipeMacros.kcal),
    protein: Math.round(entry.recipeMacros.protein),
  }

  return (
    <div className="relative w-full p-3 rounded-xl border border-border bg-card">
      <button
        onClick={onRemove}
        className="absolute top-2 right-2 p-1 rounded-full hover:bg-muted transition-colors"
        aria-label={`Remove ${entry.recipeTitle}`}
      >
        <X className="h-3.5 w-3.5 text-muted-foreground" />
      </button>
      <p className="text-sm font-medium text-foreground pr-6 leading-tight">
        {entry.recipeTitle}
      </p>
      <p className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
        <span className="flex items-center gap-0.5">
          <Flame className="h-3 w-3" />
          {perPortion.kcal} kcal
        </span>
        <span>{perPortion.protein}g protein</span>
      </p>
    </div>
  )
}

function MealSlotCell({
  date,
  mealType,
  entry,
  onAdd,
  onRemove,
}: {
  date: Date
  mealType: MealType
  entry?: MealPlanEntry
  onAdd: () => void
  onRemove: (id: string) => void
}) {
  return entry ? (
    <FilledSlot entry={entry} onRemove={() => onRemove(entry.id)} />
  ) : (
    <EmptySlot mealType={mealType} onClick={onAdd} />
  )
}

// Mobile: one-day view
function MobileDayView({
  dates,
  selectedIndex,
  onPrev,
  onNext,
  entries,
  onSlotClick,
  onRemove,
}: {
  dates: Date[]
  selectedIndex: number
  onPrev: () => void
  onNext: () => void
  entries: MealPlanEntry[]
  onSlotClick: (slot: MealSlot) => void
  onRemove: (id: string) => void
}) {
  const [displayIndex, setDisplayIndex] = useState(selectedIndex)
  const [pendingIndex, setPendingIndex] = useState<number | null>(null)
  const [direction, setDirection] = useState<"left" | "right" | null>(null)

  function navigate(dir: "left" | "right") {
    if (pendingIndex !== null) return
    const next = dir === "left" ? displayIndex + 1 : displayIndex - 1
    if (next < 0 || next > 6) return
    setDirection(dir)
    setPendingIndex(next)
  }

  function handleTransitionEnd() {
    if (pendingIndex === null) return
    if (direction === "left") onNext()
    if (direction === "right") onPrev()
    setDisplayIndex(pendingIndex)
    setPendingIndex(null)
    setDirection(null)
  }

  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => navigate("left"),
    onSwipedRight: () => navigate("right"),
    preventScrollOnSwipe: true,
    trackTouch: true,
  })

  function DayContent({ index }: { index: number }) {
    const date = dates[index]
    const dateStr = toDateString(date)

    return (
      <div className="px-4 flex flex-col gap-3 w-full shrink-0">
        {MEAL_TYPES.map((meal) => {
          const entry = entries.find(
            (e) => e.date === dateStr && e.mealType === meal
          )
          return (
            <section key={meal}>
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                {meal}
              </h2>
              <MealSlotCell
                date={date}
                mealType={meal}
                entry={entry}
                onAdd={() => onSlotClick({ dayIndex: index, mealType: meal })}
                onRemove={onRemove}
              />
            </section>
          )
        })}
      </div>
    )
  }

  const isAnimating = pendingIndex !== null

  return (
    <div {...swipeHandlers} className="min-h-[calc(100vh-8rem)] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3">
        <button
          onClick={() => navigate("right")}
          disabled={displayIndex === 0}
          className="p-2 rounded-lg hover:bg-accent transition-colors disabled:opacity-30"
          aria-label="Previous day"
        >
          <ChevronLeft className="h-5 w-5 text-foreground" />
        </button>
        <div className="text-center">
          <p className="text-sm font-semibold text-foreground">
            {formatDayHeader(dates[pendingIndex ?? displayIndex])}
          </p>
          {isToday(dates[pendingIndex ?? displayIndex]) && (
            <p className="text-xs text-primary font-medium">Today</p>
          )}
        </div>
        <button
          onClick={() => navigate("left")}
          disabled={displayIndex === 6}
          className="p-2 rounded-lg hover:bg-accent transition-colors disabled:opacity-30"
          aria-label="Next day"
        >
          <ChevronRight className="h-5 w-5 text-foreground" />
        </button>
      </div>

      <div
        className={`flex ${isAnimating ? "transition-transform duration-150 ease-out" : ""}`}
        style={{
          transform: isAnimating
            ? direction === "left"
              ? "translateX(-100%)"
              : "translateX(100%)"
            : "translateX(0)",
        }}
        onTransitionEnd={handleTransitionEnd}
      >
        {direction === "right" && pendingIndex !== null && (
          <div className="w-full shrink-0 -ml-[100%]">
            <DayContent index={pendingIndex} />
          </div>
        )}
        <DayContent index={displayIndex} />
        {direction === "left" && pendingIndex !== null && (
          <DayContent index={pendingIndex} />
        )}
      </div>
    </div>
  )
}

// Desktop: full week grid
function DesktopWeekGrid({
  dates,
  entries,
  onSlotClick,
  onRemove,
}: {
  dates: Date[]
  entries: MealPlanEntry[]
  onSlotClick: (slot: MealSlot) => void
  onRemove: (id: string) => void
}) {
  return (
    <div className="grid grid-cols-7 gap-3">
      {dates.map((date, i) => {
        const today = isToday(date)
        return (
          <div
            key={i}
            className={`text-center rounded-lg px-2 py-2 ${
              today
                ? "bg-primary text-primary-foreground"
                : "bg-card border border-border"
            }`}
          >
            <p className={`text-xs font-semibold ${today ? "text-primary-foreground" : "text-foreground"}`}>
              {DAY_LABELS[i]}
            </p>
            <p className={`text-[11px] ${today ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
              {date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </p>
          </div>
        )
      })}

      {MEAL_TYPES.map((meal) =>
        dates.map((date, i) => {
          const dateStr = toDateString(date)
          const entry = entries.find(
            (e) => e.date === dateStr && e.mealType === meal
          )
          return (
            <div key={`${meal}-${i}`}>
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
                {meal}
              </p>
              <MealSlotCell
                date={date}
                mealType={meal}
                entry={entry}
                onAdd={() => onSlotClick({ dayIndex: i, mealType: meal })}
                onRemove={onRemove}
              />
            </div>
          )
        })
      )}
    </div>
  )
}

// Main page
export function MealPlannerPage() {
  const [dates, setDates] = useState<Date[]>([])
  const [selectedDay, setSelectedDay] = useState(0)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [activeSlot, setActiveSlot] = useState<MealSlot | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const weekDates = getWeekDates()
    setDates(weekDates)
    const todayIdx = weekDates.findIndex(isToday)
    setSelectedDay(todayIdx >= 0 ? todayIdx : 0)
    setMounted(true)
  }, [])

  const weekDateStrings = useMemo(
    () => dates.map(toDateString),
    [dates]
  )

  const { entries, addEntry, removeEntry } = useMealPlan(weekDateStrings)

  function handleSlotClick(slot: MealSlot) {
    setActiveSlot(slot)
    setPickerOpen(true)
  }

  function handleRecipePicked(recipe: PickedRecipe) {
    if (!activeSlot) return

    const dateStr = toDateString(dates[activeSlot.dayIndex])
    const entry: MealPlanEntry = {
      id: `${dateStr}_${activeSlot.mealType}`,
      date: dateStr,
      mealType: activeSlot.mealType,
      recipeId: recipe.id,
      recipeTitle: recipe.title,
      recipeMacros: recipe.macros,
      recipeImage: recipe.image,
    }

    addEntry(entry)
    setActiveSlot(null)
  }

  function goPrev() {
    setSelectedDay((d) => Math.max(0, d - 1))
  }

  function goNext() {
    setSelectedDay((d) => Math.min(6, d + 1))
  }

  if (!mounted) return null

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-0">
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <h1 className="text-xl font-bold text-foreground">Meal Planner</h1>
        </div>
      </header>

      <main className="max-w-5xl mx-auto py-4 lg:px-4">
        <div className="lg:hidden">
          <MobileDayView
            dates={dates}
            selectedIndex={selectedDay}
            onPrev={goPrev}
            onNext={goNext}
            entries={entries}
            onSlotClick={handleSlotClick}
            onRemove={removeEntry}
          />
        </div>

        <div className="hidden lg:block">
          <DesktopWeekGrid
            dates={dates}
            entries={entries}
            onSlotClick={handleSlotClick}
            onRemove={removeEntry}
          />
        </div>
      </main>

      <RecipePickerModal
        open={pickerOpen}
        onClose={() => {
          setPickerOpen(false)
          setActiveSlot(null)
        }}
        onSelect={handleRecipePicked}
      />
    </div>
  )
}