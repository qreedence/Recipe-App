import { MealPlanEntry } from '@/lib/types'

interface DailyMacroSummaryProps {
  entries: MealPlanEntry[]
  compact?: boolean
}

export function DailyMacroSummary({ entries, compact = false }: DailyMacroSummaryProps) {
  if (entries.length === 0) return null

  const totals = entries.reduce(
    (acc, e) => ({
      kcal: acc.kcal + e.recipeMacros.kcal,
      carbs: acc.carbs + e.recipeMacros.carbs,
      fat: acc.fat + e.recipeMacros.fat,
      protein: acc.protein + e.recipeMacros.protein,
    }),
    { kcal: 0, carbs: 0, fat: 0, protein: 0 },
  )

  if (compact) {
    return (
      <div className="text-center py-1.5 leading-tight tracking-wide whitespace-nowrap">
        <p className="text-[12px]">
          <span className="font-semibold text-foreground">{Math.round(totals.kcal)}</span>
          <span className="text-muted-foreground">kcal</span>
        </p>
        <p className="text-[11px] text-muted-foreground">
          <span className="font-semibold text-foreground">{Math.round(totals.carbs)}</span>C
          <span className="mx-0.5 opacity-40">·</span>
          <span className="font-semibold text-foreground">{Math.round(totals.protein)}</span>P
          <span className="mx-0.5 opacity-40">·</span>
          <span className="font-semibold text-foreground">{Math.round(totals.fat)}</span>F
        </p>
      </div>
    )
  }

  const items = [
    { label: 'kcal', value: Math.round(totals.kcal), unit: '' },
    { label: 'carbs', value: Math.round(totals.carbs), unit: 'g' },
    { label: 'protein', value: Math.round(totals.protein), unit: 'g' },
    { label: 'fat', value: Math.round(totals.fat), unit: 'g' },
  ]

  return (
    <div className="flex items-center justify-between rounded-lg bg-muted px-3 py-2">
      {items.map(({ label, value, unit }) => (
        <div key={label} className="text-center">
          <p className="text-sm font-bold text-foreground">
            {value}
            <span className="text-[11px] font-normal text-muted-foreground ml-0.5">{unit}</span>
          </p>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
        </div>
      ))}
    </div>
  )
}
