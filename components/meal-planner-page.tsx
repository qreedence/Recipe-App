"use client"

import { CalendarDays } from "lucide-react"

export function MealPlannerPage() {
  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-0">
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <h1 className="text-xl font-bold text-foreground">Meal Planner</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-4">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <CalendarDays className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold text-foreground mb-1">
            Meal Planner
          </h2>
          <p className="text-sm text-muted-foreground max-w-xs">
            Weekly meal planning coming soon.
          </p>
        </div>
      </main>
    </div>
  )
}