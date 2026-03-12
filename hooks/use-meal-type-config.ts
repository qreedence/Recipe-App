import useSWR from 'swr'
import { getMealTypeConfigs, saveMealTypeConfig } from '@/lib/storage'
import { ALL_MEAL_TYPES, DEFAULT_MEAL_TYPES, MealType, MealTypeConfig } from '@/lib/types'

export function useMealTypeConfig() {
  const { data, mutate } = useSWR('meal-type-config', getMealTypeConfigs, {
    fallbackData: [],
    revalidateOnFocus: false,
  })

  function getEnabledTypes(dayIndex: number): MealType[] {
    const config = data?.find((c) => c.id === String(dayIndex))
    const enabled = config?.enabledTypes ?? DEFAULT_MEAL_TYPES
    return ALL_MEAL_TYPES.filter((t) => enabled.includes(t))
  }
  async function setEnabledTypes(dayIndex: number, types: MealType[]) {
    const config: MealTypeConfig = {
      id: String(dayIndex),
      enabledTypes: types,
    }
    await saveMealTypeConfig(config)
    mutate()
  }

  return { getEnabledTypes, setEnabledTypes }
}
