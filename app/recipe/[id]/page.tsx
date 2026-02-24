"use client"

import { use } from "react"
import { RecipeDetail } from "@/components/recipe-detail"

export default function RecipePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  return <RecipeDetail id={id} />
}
