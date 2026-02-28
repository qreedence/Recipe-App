"use client";

import { useState, useEffect } from "react";
import { Heart } from "lucide-react";

interface FavoriteButtonProps {
  isFavorite: boolean;
  onToggle?: () => void;
  size?: "sm" | "md";
  readOnly?: boolean;
}

export function FavoriteButton({
  isFavorite,
  onToggle,
  size = "md",
  readOnly = false,
}: FavoriteButtonProps) {
  const [animating, setAnimating] = useState(false);
  const heartSize = size === "sm" ? "h-3.5 w-3.5" : "h-5 w-5";

  function handleClick() {
    if (!isFavorite) {
      setAnimating(true);
    }
    onToggle?.();
  }

  useEffect(() => {
    if (animating) {
      const timer = setTimeout(() => setAnimating(false), 600);
      return () => clearTimeout(timer);
    }
  }, [animating]);

  const icon = (
    <>
      <Heart className={`${heartSize} text-border`} />
      {isFavorite && (
        <Heart
          className={`${heartSize} text-red-500 fill-red-500 absolute inset-0`}
        />
      )}
    </>
  );

  const particles = animating && (
    <>
      {[0, 60, 120, 180, 240, 300].map((angle) => (
        <span
          key={angle}
          className="absolute left-1/2 top-1/2 h-1 w-1 rounded-full bg-red-700 animate-particle"
          style={
            {
              "--angle": `${angle}deg`,
            } as React.CSSProperties
          }
        />
      ))}
    </>
  );

  if (readOnly) {
    return (
      <span className="relative" aria-label="Favorite" role="img">
        {icon}
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`relative cursor-pointer transition-transform duration-100 hover:scale-110 active:scale-95 ${
        animating ? "animate-pop" : ""
      }`}
      aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
    >
      {icon}
      {particles}
    </button>
  );
}