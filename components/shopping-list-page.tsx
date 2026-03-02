"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import { Plus, Trash2, ShoppingCart, Check, Tag, X } from "lucide-react"
import { ShoppingItem, GROCERY_CATEGORIES } from "@/lib/types"
import {
  useShoppingItems,
  addItemsAndRevalidate,
  updateItemAndRevalidate,
  deleteItemAndRevalidate,
  clearCheckedAndRevalidate,
  clearAllAndRevalidate,
} from "@/hooks/use-shopping"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

function CategoryPicker({
  value,
  onChange,
  onClose,
}: {
  value: string | null
  onChange: (cat: string | null) => void
  onClose: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [onClose])

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full mt-1 w-48 bg-card border border-border rounded-xl shadow-lg py-1 z-50 animate-in fade-in slide-in-from-top-1 duration-150 max-h-64 overflow-y-auto"
    >
      <button
        onClick={() => {
          onChange(null)
          onClose()
        }}
        className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-accent transition-colors duration-100"
      >
        <span className={value === null ? "text-foreground font-medium" : "text-muted-foreground"}>
          Unsorted
        </span>
        {value === null && <Check className="h-4 w-4 text-primary" />}
      </button>
      {GROCERY_CATEGORIES.map((cat) => (
        <button
          key={cat}
          onClick={() => {
            onChange(cat)
            onClose()
          }}
          className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-accent transition-colors duration-100"
        >
          <span className={value === cat ? "text-foreground font-medium" : "text-muted-foreground"}>
            {cat}
          </span>
          {value === cat && <Check className="h-4 w-4 text-primary" />}
        </button>
      ))}
    </div>
  )
}

function ShoppingItemRow({ item }: { item: ShoppingItem }) {
  const [showCategoryPicker, setShowCategoryPicker] = useState(false)

  async function toggleCheck() {
    await updateItemAndRevalidate(item.id, { checked: !item.checked })
  }

  async function setCategory(cat: string | null) {
    await updateItemAndRevalidate(item.id, { category: cat })
  }

  async function handleDelete() {
    await deleteItemAndRevalidate(item.id)
  }

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 group transition-opacity duration-200 ${
        item.checked ? "opacity-50" : ""
      }`}
    >
      {/* Checkbox */}
      <button
        onClick={toggleCheck}
        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors duration-150 ${
          item.checked
            ? "bg-primary border-primary"
            : "border-muted-foreground/40 hover:border-primary"
        }`}
        aria-label={item.checked ? "Uncheck item" : "Check item"}
      >
        {item.checked && <Check className="h-3 w-3 text-primary-foreground" />}
      </button>

      {/* Item details */}
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm leading-tight ${
            item.checked
              ? "line-through text-muted-foreground"
              : "text-card-foreground"
          }`}
        >
          {item.name}
        </p>
        {item.amount && (
          <p className="text-xs text-muted-foreground mt-0.5">{item.amount}</p>
        )}
      </div>

      {/* Category button */}
      <div className="relative shrink-0">
        <button
          onClick={() => setShowCategoryPicker(!showCategoryPicker)}
          className={`p-1.5 rounded-md transition-colors duration-150 ${
            item.category
              ? "text-primary hover:bg-primary/10"
              : "text-muted-foreground/40 hover:text-muted-foreground hover:bg-accent"
          }`}
          aria-label="Set category"
        >
          <Tag className="h-4 w-4" />
        </button>
        {showCategoryPicker && (
          <CategoryPicker
            value={item.category}
            onChange={setCategory}
            onClose={() => setShowCategoryPicker(false)}
          />
        )}
      </div>

      {/* Delete */}
      <button
        onClick={handleDelete}
        className="p-1.5 rounded-md text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-colors duration-150 shrink-0 opacity-0 group-hover:opacity-100 focus:opacity-100"
        aria-label="Delete item"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

export function ShoppingListPage() {
  const { items, isLoading } = useShoppingItems()
  const [newItemName, setNewItemName] = useState("")
  const [newItemAmount, setNewItemAmount] = useState("")
  const [newItemCategory, setNewItemCategory] = useState<string | null>(null)
  const [showNewItemCategoryPicker, setShowNewItemCategoryPicker] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const checkedCount = items.filter((i) => i.checked).length
  const totalCount = items.length

  // Group items by category, unchecked first within each group
  const grouped = useMemo(() => {
    const unchecked = items.filter((i) => !i.checked)
    const checked = items.filter((i) => i.checked)

    const groups: Record<string, ShoppingItem[]> = {}

    for (const item of unchecked) {
      const key = item.category ?? "Unsorted"
      if (!groups[key]) groups[key] = []
      groups[key].push(item)
    }

    // Sort category keys: named categories first alphabetically, "Unsorted" last
    const sortedKeys = Object.keys(groups).sort((a, b) => {
      if (a === "Unsorted") return 1
      if (b === "Unsorted") return -1
      return a.localeCompare(b)
    })

    return { groups, sortedKeys, checked }
  }, [items])

  async function handleAddItem(e: React.FormEvent) {
    e.preventDefault()
    if (!newItemName.trim()) return

    const item: ShoppingItem = {
      id: crypto.randomUUID(),
      name: newItemName.trim(),
      amount: newItemAmount.trim(),
      checked: false,
      category: newItemCategory,
      recipeId: null,
      recipeTitle: null,
      createdAt: Date.now(),
    }

    await addItemsAndRevalidate([item])
    setNewItemName("");
    setNewItemAmount("");
    setNewItemCategory(null);
    inputRef.current?.focus();
  }

  if (isLoading) return null

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-0">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-xl font-bold text-foreground lg:hidden">Shopping List</h1>
              <h1 className="text-xl font-bold text-foreground hidden lg:block">Shopping List</h1>
              {totalCount > 0 && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {checkedCount} of {totalCount} items checked
                </p>
              )}
            </div>
            {totalCount > 0 && (
              <div className="flex items-center gap-2">
                {checkedCount > 0 && (
                  <button
                    onClick={clearCheckedAndRevalidate}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors px-2.5 py-1.5 rounded-lg hover:bg-accent"
                  >
                    Clear checked
                  </button>
                )}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button
                      className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      aria-label="Clear all items"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Clear shopping list?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will remove all {totalCount} items from your shopping list.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={clearAllAndRevalidate}>
                        Clear All
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
          </div>

          {/* Add item form */}
          <form onSubmit={handleAddItem} className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              placeholder="Add an item..."
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              className="flex-1 h-10 rounded-lg border border-border bg-card px-3 text-sm text-card-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <input
              type="text"
              placeholder="Qty"
              value={newItemAmount}
              onChange={(e) => setNewItemAmount(e.target.value)}
              className="w-20 h-10 rounded-lg border border-border bg-card px-3 text-sm text-card-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            {/* Category selector for new item */}
  <button
    type="button"
    onClick={() =>
      setShowNewItemCategoryPicker(!showNewItemCategoryPicker)
    }
    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-colors duration-150 ${
      newItemCategory
        ? "bg-primary/10 text-primary"
        : "text-muted-foreground hover:bg-accent"
    }`}
  >
    <Tag className="h-3.5 w-3.5" />
    {newItemCategory ?? "Category"}
    {newItemCategory && (
      <span
        role="button"
        onClick={(e) => {
          e.stopPropagation()
          setNewItemCategory(null)
          setShowNewItemCategoryPicker(false)
        }}
        className="ml-0.5 hover:text-destructive"
      >
        <X className="h-3 w-3" />
      </span>
    )}
  </button>
  {showNewItemCategoryPicker && (
    <CategoryPicker
      value={newItemCategory}
      onChange={(cat) => setNewItemCategory(cat)}
      onClose={() => setShowNewItemCategoryPicker(false)}
    />
  )}

            <button
              type="submit"
              disabled={!newItemName.trim()}
              className="h-10 w-10 rounded-lg bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-40 shrink-0"
              aria-label="Add item"
            >
              <Plus className="h-5 w-5" />
            </button>
          </form>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-2xl mx-auto px-4 py-4">
        {totalCount === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <ShoppingCart className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-semibold text-foreground mb-1">
              List is empty
            </h2>
            <p className="text-sm text-muted-foreground max-w-xs">
              Add items above, or tap &ldquo;Add to shopping list&rdquo; from any recipe.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {/* Unchecked items grouped by category */}
            {grouped.sortedKeys.map((category) => (
              <section key={category}>
                <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 mb-1">
                  {category}
                </h2>
                <div className="bg-card rounded-xl border border-border divide-y divide-border">
                  {grouped.groups[category].map((item) => (
                    <ShoppingItemRow key={item.id} item={item} />
                  ))}
                </div>
              </section>
            ))}

            {/* Checked items at the bottom */}
            {grouped.checked.length > 0 && (
              <section>
                <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 mb-1">
                  Checked ({grouped.checked.length})
                </h2>
                <div className="bg-card rounded-xl border border-border divide-y divide-border">
                  {grouped.checked.map((item) => (
                    <ShoppingItemRow key={item.id} item={item} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
