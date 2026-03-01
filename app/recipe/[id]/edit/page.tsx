"use client"

import { use } from "react"
import { useRecipe } from "@/hooks/use-recipes"
import { RecipeForm } from "@/components/create/recipe-form"

interface EditPageProps {
  params: Promise<{ id: string }>
}

export default function EditPage({ params }: EditPageProps) {
  const { id } = use(params)
  const { recipe, isLoading } = useRecipe(id)

  if (isLoading) return null

  if (!recipe) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Recipe not found.</p>
      </div>
    )
  }

  return <RecipeForm mode="edit" initialData={recipe} />
}