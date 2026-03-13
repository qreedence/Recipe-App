interface ParsedAmount {
  quantity: number | null
  unit: string
}

const UNIT_ALIASES: Record<string, string> = {
  // Weight
  gram: 'g',
  grams: 'g',
  kilogram: 'kg',
  kilograms: 'kg',
  // Volume
  milliliter: 'ml',
  milliliters: 'ml',
  deciliter: 'dl',
  deciliters: 'dl',
  liter: 'l',
  liters: 'l',
  teaspoon: 'tsp',
  teaspoons: 'tsp',
  tablespoon: 'tbsp',
  tablespoons: 'tbsp',
  cups: 'cup',
  // Swedish
  styck: 'st',
  stycken: 'st',
  klyftor: 'cloves',
  skivor: 'slices',
  nypa: 'pinch',
  burk: 'can',
  burkar: 'can',
  påse: 'bag',
  påsar: 'bag',
  förpackning: 'package',
  knippe: 'bunch',
}

export function parseAmount(raw: string): ParsedAmount {
  const trimmed = raw.trim()
  if (!trimmed) return { quantity: null, unit: '' }

  // Try: "200g", "1.5dl", "2st" (no space)
  const noSpace = trimmed.match(/^(\d+(?:\.\d+)?)\s*(.+)$/)
  if (noSpace) {
    const num = parseFloat(noSpace[1])
    const rawUnit = noSpace[2].trim().toLowerCase()
    const unit = UNIT_ALIASES[rawUnit] ?? rawUnit
    return { quantity: num, unit }
  }

  // Try: just a number "3"
  if (/^\d+(?:\.\d+)?$/.test(trimmed)) {
    return { quantity: parseFloat(trimmed), unit: '' }
  }

  // Can't parse
  return { quantity: null, unit: '' }
}
