'use client'

import { useState, useMemo, useEffect } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  Flame,
  Drumstick,
  EllipsisVertical,
  Trash2,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
import { useSwipeable } from 'react-swipeable'
import { RecipePickerModal, PickedRecipe } from './recipe-picker-modal'
import { useMealPlan } from '@/hooks/use-meal-plan'
import { ALL_MEAL_TYPES, type MealType, type MealPlanEntry } from '@/lib/types'
import { useMealTypeConfig } from '@/hooks/use-meal-type-config'
import Link from 'next/link'
import { MealTypeToggle } from './meal-type-toggle'

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const

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
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
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
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
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
      {/* <span className="text-xs text-muted-foreground">Add {mealType}</span> */}
    </button>
  )
}

function FilledSlot({
  entry,
  onRemove,
  compact = false,
}: {
  entry: MealPlanEntry
  onRemove: () => void
  compact?: boolean
}) {
  const perPortion = {
    kcal: Math.round(entry.recipeMacros.kcal),
    protein: Math.round(entry.recipeMacros.protein),
  }

  return (
    <div
      className={`relative w-full rounded-xl border border-border bg-card overflow-hidden flex ${
        compact ? 'flex-col' : ''
      }`}
    >
      <Link
        href={`/recipe/${entry.recipeId}`}
        className={`shrink-0 bg-muted block ${
          compact ? 'w-full aspect-[4/3] overflow-hidden' : 'w-20 h-20'
        }`}
      >
        {entry.recipeImage ? (
          <img
            src={entry.recipeImage}
            alt={entry.recipeTitle}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <Drumstick className="h-6 w-6" />
          </div>
        )}
      </Link>

      <Link
        href={`/recipe/${entry.recipeId}`}
        className="flex-1 min-w-0 p-2.5 flex flex-col justify-center"
      >
        <p
          className={`font-semibold text-card-foreground leading-tight line-clamp-2 pr-6 ${
            compact ? 'text-xs' : 'text-sm'
          }`}
        >
          {entry.recipeTitle}
        </p>
        <p className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
          <span className="flex items-center gap-0.5">
            <Flame className="h-3 w-3" />
            {perPortion.kcal} kcal
          </span>
          <span>{perPortion.protein}g protein</span>
        </p>
      </Link>

      <button
        onClick={(e) => {
          e.preventDefault()
          onRemove()
        }}
        className="absolute top-1.5 right-1.5 p-1 rounded-full bg-card/80 hover:bg-muted transition-colors"
        aria-label={`Remove ${entry.recipeTitle}`}
      >
        <X className="h-3.5 w-3.5 text-muted-foreground" />
      </button>
    </div>
  )
}

function MealSlotCell({
  date,
  mealType,
  entry,
  onAdd,
  onRemove,
  compact = false,
}: {
  date: Date
  mealType: MealType
  entry?: MealPlanEntry
  onAdd: () => void
  onRemove: (id: string) => void
  compact?: boolean
}) {
  return entry ? (
    <FilledSlot entry={entry} onRemove={() => onRemove(entry.id)} compact={compact} />
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
  getEnabledTypes,
  setEnabledTypes,
}: {
  dates: Date[]
  selectedIndex: number
  onPrev: () => void
  onNext: () => void
  entries: MealPlanEntry[]
  onSlotClick: (slot: MealSlot) => void
  onRemove: (id: string) => void
  getEnabledTypes: (dayIndex: number) => MealType[]
  setEnabledTypes: (dayIndex: number, types: MealType[]) => void
}) {
  const [displayIndex, setDisplayIndex] = useState(selectedIndex)
  const [pendingIndex, setPendingIndex] = useState<number | null>(null)
  const [direction, setDirection] = useState<'left' | 'right' | null>(null)

  function navigate(dir: 'left' | 'right') {
    if (pendingIndex !== null) return
    const next = dir === 'left' ? displayIndex + 1 : displayIndex - 1
    if (next < 0 || next > 6) return
    setDirection(dir)
    setPendingIndex(next)
  }

  function handleTransitionEnd() {
    if (pendingIndex === null) return
    if (direction === 'left') onNext()
    if (direction === 'right') onPrev()
    setDisplayIndex(pendingIndex)
    setPendingIndex(null)
    setDirection(null)
  }

  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => navigate('left'),
    onSwipedRight: () => navigate('right'),
    preventScrollOnSwipe: true,
    trackTouch: true,
  })

  function DayContent({ index }: { index: number }) {
    const date = dates[index]
    const dateStr = toDateString(date)

    return (
      <div className="px-4 flex flex-col gap-3 w-full shrink-0">
        {getEnabledTypes(index).map((meal) => {
          const entry = entries.find((e) => e.date === dateStr && e.mealType === meal)
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
          onClick={() => navigate('right')}
          disabled={displayIndex === 0}
          className="p-2 rounded-lg hover:bg-accent transition-colors disabled:opacity-30"
          aria-label="Previous day"
        >
          <ChevronLeft className="h-5 w-5 text-foreground" />
        </button>
        <MealTypeToggle
          dayIndex={pendingIndex ?? displayIndex}
          dayLabel={formatDayHeader(dates[pendingIndex ?? displayIndex])}
          enabledTypes={getEnabledTypes(pendingIndex ?? displayIndex)}
          onToggle={(di, types) => setEnabledTypes(di, types)}
          hasRecipe={(mealType) => {
            const dateStr = toDateString(dates[pendingIndex ?? displayIndex])
            return entries.some((e) => e.date === dateStr && e.mealType === mealType)
          }}
          onRemoveEntry={(mealType) => {
            const dateStr = toDateString(dates[pendingIndex ?? displayIndex])
            const entry = entries.find((e) => e.date === dateStr && e.mealType === mealType)
            if (entry) onRemove(entry.id)
          }}
        >
          <div className="text-center cursor-pointer">
            <p className="text-sm font-semibold text-foreground">
              {formatDayHeader(dates[pendingIndex ?? displayIndex])}
            </p>
            {isToday(dates[pendingIndex ?? displayIndex]) && (
              <p className="text-xs text-primary font-medium">Today</p>
            )}
          </div>
        </MealTypeToggle>
        <button
          onClick={() => navigate('left')}
          disabled={displayIndex === 6}
          className="p-2 rounded-lg hover:bg-accent transition-colors disabled:opacity-30"
          aria-label="Next day"
        >
          <ChevronRight className="h-5 w-5 text-foreground" />
        </button>
      </div>

      <div
        className={`flex ${isAnimating ? 'transition-transform duration-150 ease-out' : ''}`}
        style={{
          transform: isAnimating
            ? direction === 'left'
              ? 'translateX(-100%)'
              : 'translateX(100%)'
            : 'translateX(0)',
        }}
        onTransitionEnd={handleTransitionEnd}
      >
        {direction === 'right' && pendingIndex !== null && (
          <div className="w-full shrink-0 -ml-[100%]">
            <DayContent index={pendingIndex} />
          </div>
        )}
        <DayContent index={displayIndex} />
        {direction === 'left' && pendingIndex !== null && <DayContent index={pendingIndex} />}
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
  getEnabledTypes,
  setEnabledTypes,
}: {
  dates: Date[]
  entries: MealPlanEntry[]
  onSlotClick: (slot: MealSlot) => void
  onRemove: (id: string) => void
  getEnabledTypes: (dayIndex: number) => MealType[]
  setEnabledTypes: (dayIndex: number, types: MealType[]) => void
}) {
  return (
    <div className="grid grid-cols-7 gap-3">
      {dates.map((date, i) => {
        const today = isToday(date)
        return (
          <MealTypeToggle
            key={i}
            dayIndex={i}
            dayLabel={`${DAY_LABELS[i]} ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
            enabledTypes={getEnabledTypes(i)}
            onToggle={(di, types) => setEnabledTypes(di, types)}
            hasRecipe={(mealType) => {
              const dateStr = toDateString(dates[i])
              return entries.some((e) => e.date === dateStr && e.mealType === mealType)
            }}
            onRemoveEntry={(mealType) => {
              const dateStr = toDateString(dates[i])
              const entry = entries.find((e) => e.date === dateStr && e.mealType === mealType)
              if (entry) onRemove(entry.id)
            }}
          >
            <div
              className={`text-center rounded-lg px-2 py-2 cursor-pointer transition-colors ${
                today
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card border border-border hover:bg-accent'
              }`}
            >
              <p
                className={`text-xs font-semibold ${today ? 'text-primary-foreground' : 'text-foreground'}`}
              >
                {DAY_LABELS[i]}
              </p>
              <p
                className={`text-[11px] ${today ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}
              >
                {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </p>
            </div>
          </MealTypeToggle>
        )
      })}

      {dates.map((date, i) => {
        const dateStr = toDateString(date)
        const enabled = getEnabledTypes(i)
        return (
          <div key={`col-${i}`} className="flex flex-col gap-3">
            {enabled.map((meal) => {
              const entry = entries.find((e) => e.date === dateStr && e.mealType === meal)
              return (
                <div key={meal}>
                  <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
                    {meal}
                  </p>
                  <MealSlotCell
                    date={date}
                    mealType={meal}
                    entry={entry}
                    onAdd={() => onSlotClick({ dayIndex: i, mealType: meal })}
                    onRemove={onRemove}
                    compact
                  />
                </div>
              )
            })}
          </div>
        )
      })}
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
  const [clearDialogOpen, setClearDialogOpen] = useState(false)

  useEffect(() => {
    const weekDates = getWeekDates()
    setDates(weekDates)
    const todayIdx = weekDates.findIndex(isToday)
    setSelectedDay(todayIdx >= 0 ? todayIdx : 0)
    setMounted(true)
  }, [])

  const weekDateStrings = useMemo(() => dates.map(toDateString), [dates])

  const { entries, addEntry, removeEntry, clearWeek } = useMealPlan(weekDateStrings)
  const { getEnabledTypes, setEnabledTypes } = useMealTypeConfig()

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
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-bold text-foreground">Meal Planner</h1>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="p-2 rounded-lg hover:bg-accent transition-colors"
                aria-label="Menu"
              >
                <EllipsisVertical className="h-5 w-5 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                variant="destructive"
                disabled={entries.length === 0}
                onSelect={() => setClearDialogOpen(true)}
              >
                <Trash2 className="h-4 w-4" />
                Clear week
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-4 lg:px-4">
        <div className="lg:hidden">
          <MobileDayView
            dates={dates}
            selectedIndex={selectedDay}
            onPrev={goPrev}
            onNext={goNext}
            entries={entries}
            onSlotClick={handleSlotClick}
            onRemove={removeEntry}
            getEnabledTypes={getEnabledTypes}
            setEnabledTypes={setEnabledTypes}
          />
        </div>

        <div className="hidden lg:block">
          <DesktopWeekGrid
            dates={dates}
            entries={entries}
            onSlotClick={handleSlotClick}
            onRemove={removeEntry}
            getEnabledTypes={getEnabledTypes}
            setEnabledTypes={setEnabledTypes}
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
        plannedRecipeIds={entries.map((e) => e.recipeId)}
      />
      <AlertDialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader className="text-center sm:text-center">
            <AlertDialogTitle>Clear all meals?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove all planned meals for this week.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row justify-center items-center sm:justify-center">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => clearWeek()}
              className="text-destructive bg-destructive/10 hover:bg-destructive/20 transition-colors duration-150"
            >
              Clear week
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
