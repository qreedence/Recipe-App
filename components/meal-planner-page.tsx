"use client"

import { useState, useMemo, useEffect } from "react"
import { ChevronLeft, ChevronRight, Plus, CalendarDays } from "lucide-react"
import { useSwipeable } from "react-swipeable"
import { RecipePickerModal } from "./recipe-picker-modal"

const MEAL_TYPES = ["Lunch", "Dinner"] as const
const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const

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

// ── Mobile: one day at a time ──────────────────────────────
function MobileDayView({
  dates,
  selectedIndex,
  onPrev,
  onNext,
  onSlotClick,
}: {
  dates: Date[]
  selectedIndex: number
  onPrev: () => void
  onNext: () => void
  onSlotClick: () => void
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
    return (
      <div className="px-4 flex flex-col gap-3 w-full shrink-0">
        {MEAL_TYPES.map((meal) => (
          <section key={meal}>
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              {meal}
            </h2>
            <EmptySlot mealType={meal} onClick={onSlotClick} />
          </section>
        ))}
      </div>
    )
  }

  const isAnimating = pendingIndex !== null

  return (
    <div {...swipeHandlers} className="min-h-[calc(100vh-8rem)] overflow-hidden">
      {/* Day navigator */}
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

      {/* Carousel track */}
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

// ── Desktop: full week grid ────────────────────────────────
function DesktopWeekGrid({
  dates,
  onSlotClick,
}: {
  dates: Date[]
  onSlotClick: () => void
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
        dates.map((_, i) => (
          <div key={`${meal}-${i}`}>
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
              {meal}
            </p>
            <EmptySlot mealType={meal} onClick={onSlotClick} />
          </div>
        ))
      )}
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────
export function MealPlannerPage() {
  const [dates, setDates] = useState<Date[]>([])
  const [selectedDay, setSelectedDay] = useState(0)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const weekDates = getWeekDates()
    setDates(weekDates)
    const todayIdx = weekDates.findIndex(isToday)
    setSelectedDay(todayIdx >= 0 ? todayIdx : 0)
    setMounted(true)
  }, [])

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
        {/* Mobile view */}
        <div className="lg:hidden">
          <MobileDayView
            dates={dates}
            selectedIndex={selectedDay}
            onPrev={goPrev}
            onNext={goNext}
            onSlotClick={() => setPickerOpen(true)}
          />
        </div>

        {/* Desktop view */}
        <div className="hidden lg:block">
          <DesktopWeekGrid
            dates={dates}
            onSlotClick={() => setPickerOpen(true)}
          />
        </div>
      </main>

      <RecipePickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(recipe) => {
          console.log("Picked:", recipe)
        }}
      />
    </div>
  )
}