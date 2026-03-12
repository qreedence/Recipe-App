import useSWR from 'swr'
import {
  getMealPlanEntries,
  saveMealPlanEntry,
  deleteMealPlanEntry,
  clearMealPlanEntries,
} from '@/lib/storage'
import { MealPlanEntry } from '@/lib/types'

export function useMealPlan(weekDates: string[]) {
  const key = weekDates.length > 0 ? `meal-plan-${weekDates[0]}` : null

  const { data, error, isLoading, mutate } = useSWR(key, () => getMealPlanEntries(weekDates), {
    fallbackData: [],
    revalidateOnFocus: false,
  })

  async function addEntry(entry: MealPlanEntry) {
    await saveMealPlanEntry(entry)
    mutate()
  }

  async function removeEntry(id: string) {
    await deleteMealPlanEntry(id)
    mutate()
  }

  async function clearWeek() {
    await clearMealPlanEntries(weekDates)
    mutate()
  }

  return {
    entries: data ?? [],
    isLoading,
    error,
    addEntry,
    removeEntry,
    clearWeek,
  }
}
