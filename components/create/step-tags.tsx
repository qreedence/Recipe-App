"use client"

import { useState } from "react"
import { Plus, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { PRESET_TAGS } from "@/lib/types"

interface StepTagsProps {
  tags: string[]
  setTags: (v: string[]) => void
}

export function StepTags({ tags, setTags }: StepTagsProps) {
  const [customInput, setCustomInput] = useState("")

  function toggleTag(tag: string) {
    if (tags.includes(tag)) {
      setTags(tags.filter((t) => t !== tag))
    } else {
      setTags([...tags, tag])
    }
  }

  function addCustomTag() {
    const trimmed = customInput.trim()
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed])
      setCustomInput("")
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault()
      addCustomTag()
    }
  }

  const customTags = tags.filter(
    (t) => !PRESET_TAGS.map((p) => p as string).includes(t)
  )

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-sm font-medium text-foreground mb-1">Tags</h2>
        <p className="text-xs text-muted-foreground">
          Select tags to help you filter recipes later.
        </p>
      </div>

      {/* Preset tags */}
      <div className="flex flex-wrap gap-2">
        {PRESET_TAGS.map((tag) => {
          const active = tags.includes(tag)
          return (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
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

      {/* Custom tags */}
      <div>
        <label className="text-sm font-medium text-foreground mb-1.5 block">
          Custom Tags
        </label>
        <div className="flex gap-2">
          <Input
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Add a custom tag..."
            className="flex-1"
          />
          <button
            onClick={addCustomTag}
            disabled={!customInput.trim()}
            className="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50 hover:opacity-90 transition-opacity"
            aria-label="Add custom tag"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
        {customTags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {customTags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-sm font-medium"
              >
                {tag}
                <button
                  onClick={() => toggleTag(tag)}
                  className="hover:opacity-70 transition-opacity"
                  aria-label={`Remove ${tag}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
