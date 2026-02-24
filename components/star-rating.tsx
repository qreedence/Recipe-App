"use client"

import { useState } from "react"
import { Star } from "lucide-react"

interface StarRatingProps {
  value: number | null
  onChange?: (value: number) => void
  size?: "sm" | "md"
  readOnly?: boolean
}

export function StarRating({
  value,
  onChange,
  size = "md",
  readOnly = false,
}: StarRatingProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null)
  const displayValue = hoverValue ?? value ?? 0
  const starSize = size === "sm" ? "h-3.5 w-3.5" : "h-5 w-5"
  const gapClass = size === "sm" ? "gap-0.5" : "gap-0.5"

  function getStarFill(starIndex: number): "full" | "half" | "empty" {
    const diff = displayValue - starIndex
    if (diff >= 1) return "full"
    if (diff >= 0.5) return "half"
    return "empty"
  }

  function handleClick(starIndex: number, e: React.MouseEvent<HTMLButtonElement>) {
    if (readOnly || !onChange) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const isLeftHalf = x < rect.width / 2
    const newValue = starIndex + (isLeftHalf ? 0.5 : 1)
    onChange(newValue === value ? 0 : newValue)
  }

  function handleMouseMove(starIndex: number, e: React.MouseEvent<HTMLButtonElement>) {
    if (readOnly) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const isLeftHalf = x < rect.width / 2
    setHoverValue(starIndex + (isLeftHalf ? 0.5 : 1))
  }

  return (
    <div
      className={`inline-flex ${gapClass}`}
      onMouseLeave={() => !readOnly && setHoverValue(null)}
      role={readOnly ? "img" : "radiogroup"}
      aria-label={value ? `Rating: ${value} out of 5 stars` : "No rating"}
    >
      {[0, 1, 2, 3, 4].map((starIndex) => {
        const fill = getStarFill(starIndex)

        if (readOnly) {
          return (
            <span key={starIndex} className="relative">
              <Star className={`${starSize} text-border`} />
              {fill === "full" && (
                <Star
                  className={`${starSize} text-amber-400 fill-amber-400 absolute inset-0`}
                />
              )}
              {fill === "half" && (
                <span
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: "50%" }}
                >
                  <Star
                    className={`${starSize} text-amber-400 fill-amber-400`}
                  />
                </span>
              )}
            </span>
          )
        }

        return (
          <button
            key={starIndex}
            type="button"
            onClick={(e) => handleClick(starIndex, e)}
            onMouseMove={(e) => handleMouseMove(starIndex, e)}
            className={`relative cursor-pointer transition-transform duration-100 hover:scale-110 ${
              readOnly ? "" : "active:scale-95"
            }`}
            aria-label={`${starIndex + 1} stars`}
          >
            <Star className={`${starSize} text-border`} />
            {fill === "full" && (
              <Star
                className={`${starSize} text-amber-400 fill-amber-400 absolute inset-0`}
              />
            )}
            {fill === "half" && (
              <span
                className="absolute inset-0 overflow-hidden"
                style={{ width: "50%" }}
              >
                <Star
                  className={`${starSize} text-amber-400 fill-amber-400`}
                />
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
