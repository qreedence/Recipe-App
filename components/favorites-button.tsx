"use client";

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
  const heartSize = size === "sm" ? "h-3.5 w-3.5" : "h-5 w-5";

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
      onClick={onToggle}
      className="relative cursor-pointer transition-transform duration-100 hover:scale-110 active:scale-95"
      aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
    >
      {icon}
    </button>
  );
}