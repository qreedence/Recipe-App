"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import Link from "next/link"
import { Plus, SlidersHorizontal, BookOpen, ArrowUpDown, Check, Heart } from "lucide-react"
import { useRecipes } from "@/hooks/use-recipes"
import { SearchBar } from "@/components/search-bar"
import { FilterChips } from "@/components/filter-chips"
import { RecipeCard } from "@/components/recipe-card"
import { SettingsMenu } from "./settings-menu"

type SortOption = "recent" | "rating" | "kcal-asc" | "kcal-desc" | "protein-desc"

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "recent", label: "Recently Added" },
  { value: "rating", label: "Highest Rated" },
  { value: "kcal-asc", label: "Lowest Calories" },
  { value: "kcal-desc", label: "Highest Calories" },
  { value: "protein-desc", label: "Most Protein" },
]

function SortDropdown({
  value,
  onChange,
}: {
  value: SortOption
  onChange: (v: SortOption) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClick)
      return () => document.removeEventListener("mousedown", handleClick)
    }
  }, [open])

  const currentLabel = SORT_OPTIONS.find((o) => o.value === value)?.label

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`p-2.5 rounded-lg border transition-colors duration-150 ${
          value !== "recent"
            ? "bg-primary text-primary-foreground border-primary"
            : "bg-card text-foreground border-border hover:bg-accent"
        }`}
        aria-label={`Sort by: ${currentLabel}`}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <ArrowUpDown className="h-4 w-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-48 bg-card border border-border rounded-xl shadow-lg py-1 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                onChange(opt.value)
                setOpen(false)
              }}
              className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-accent transition-colors duration-100"
              role="option"
              aria-selected={value === opt.value}
            >
              <span
                className={
                  value === opt.value
                    ? "text-foreground font-medium"
                    : "text-muted-foreground"
                }
              >
                {opt.label}
              </span>
              {value === opt.value && (
                <Check className="h-4 w-4 text-primary" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export function BrowsePage() {
  const { recipes, isLoading } = useRecipes()
  const [search, setSearch] = useState("")
  const [filterTags, setFilterTags] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)
  const [sort, setSort] = useState<SortOption>("recent")
  const [favoritesOnly, setFavoritesOnly] = useState(false);

  const filtered = useMemo(() => {
    let result = recipes

    if (favoritesOnly) {
      result = result.filter((r) => r.isFavorite)
    }
       
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.ingredients.some((i) => i.name.toLowerCase().includes(q)) ||
          r.tags.some((t) => t.toLowerCase().includes(q))
      )
    }
    if (filterTags.length > 0) {
      result = result.filter((r) =>
        filterTags.every((tag) =>
          r.tags.some((t) => t.toLowerCase() === tag.toLowerCase())
        )
      )
    }
    result = [...result].sort((a, b) => {
      switch (sort) {
        case "rating":
          return (b.rating ?? 0) - (a.rating ?? 0)
        case "kcal-asc": {
          const aKcal = a.portions > 0 ? a.macros.kcal / a.portions : 0
          const bKcal = b.portions > 0 ? b.macros.kcal / b.portions : 0
          return aKcal - bKcal
        }
        case "kcal-desc": {
          const aKcal = a.portions > 0 ? a.macros.kcal / a.portions : 0
          const bKcal = b.portions > 0 ? b.macros.kcal / b.portions : 0
          return bKcal - aKcal
        }
        case "protein-desc": {
          const aProt = a.portions > 0 ? a.macros.protein / a.portions : 0
          const bProt = b.portions > 0 ? b.macros.protein / b.portions : 0
          return bProt - aProt
        }
        case "recent":
        default:
          return b.createdAt - a.createdAt
      }
    })

    return result
  }, [recipes, search, filterTags, sort, favoritesOnly])

  if (isLoading) return null

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-0">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-3 lg:hidden">
<h1 className="text-2xl uppercase tracking-wider">
  <span className="font-black text-orange-500">Recipe</span>
  <span className="font-light text-orange-300">book</span>
</h1>
  <SettingsMenu />
</div>
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <SearchBar value={search} onChange={setSearch} />
            </div>
            <button
  onClick={() => setFavoritesOnly(!favoritesOnly)}
  className={`p-2.5 rounded-lg border transition-colors duration-150 ${
    favoritesOnly
      ? "bg-primary text-primary-foreground border-primary"
      : "bg-card text-foreground border-border hover:bg-accent"
  }`}
  aria-label="Show favorites only"
>
  <Heart className="h-4 w-4" />
</button>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2.5 rounded-lg border transition-colors duration-150 ${
                showFilters || filterTags.length > 0
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-foreground border-border hover:bg-accent"
              }`}
              aria-label="Toggle filters"
            >
              <SlidersHorizontal className="h-4 w-4" />
            </button>
            <SortDropdown value={sort} onChange={setSort} />
          </div>
          {showFilters && (
            <div className="mt-3 pb-1">
              <FilterChips selected={filterTags} onChange={setFilterTags} />
            </div>
          )}
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-4 py-6">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <BookOpen className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-semibold text-foreground mb-1">
              {recipes.length === 0 ? "No recipes yet" : "No matches found"}
            </h2>
            <p className="text-sm text-muted-foreground mb-6 max-w-xs">
              {recipes.length === 0
                ? "Create your first recipe to get started with your personal cookbook."
                : "Try adjusting your search or filters."}
            </p>
            {recipes.length === 0 && (
              <Link
                href="/create"
                className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
              >
                <Plus className="h-4 w-4" />
                Create Recipe
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {filtered.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
