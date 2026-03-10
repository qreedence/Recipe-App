"use client"

import { useEffect } from "react"
import { db } from "@/lib/db"
import { compressImage } from "@/lib/compress-image"

const MIGRATION_KEY = "recipebook:image-migration-v1"

export function ImageMigration() {
  useEffect(() => {
    if (localStorage.getItem(MIGRATION_KEY)) return

    async function migrate() {
      const recipes = await db.recipes
        .filter((r) => r.image !== null && !r.image.startsWith("data:image/webp"))
        .toArray()

      if (recipes.length === 0) {
        localStorage.setItem(MIGRATION_KEY, Date.now().toString())
        return
      }

      for (const recipe of recipes) {
        try {
          const compressed = await compressImage(recipe.image!)
          await db.recipes.update(recipe.id, { image: compressed })
        } catch (err) {
          console.error(`Failed to migrate image for "${recipe.title}":`, err)
        }
      }

      localStorage.setItem(MIGRATION_KEY, Date.now().toString())
      console.log(`Migrated ${recipes.length} recipe image(s) to webp`)
    }

    migrate()
  }, [])

  return null
}