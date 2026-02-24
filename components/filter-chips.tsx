"use client"

import { PRESET_TAGS } from "@/lib/types"

interface FilterChipsProps {
  selected: string[]
  onChange: (tags: string[]) => void
}

export function FilterChips({ selected, onChange }: FilterChipsProps) {
  function toggle(tag: string) {
    if (selected.includes(tag)) {
      onChange(selected.filter((t) => t !== tag))
    } else {
      onChange([...selected, tag])
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {PRESET_TAGS.map((tag) => {
        const active = selected.includes(tag)
        return (
          <button
            key={tag}
            onClick={() => toggle(tag)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors duration-150 ${
              active
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-accent"
            }`}
          >
            {tag}
          </button>
        )
      })}
    </div>
  )
}
