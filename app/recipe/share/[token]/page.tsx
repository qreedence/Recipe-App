import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { SharedRecipePreview } from '@/components/shared-recipe-preview'
import Link from 'next/link'

type Props = {
  params: Promise<{ token: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params
  const supabase = await createClient()

  const { data } = await supabase
    .from('shared_recipes')
    .select('recipe_snapshot')
    .eq('id', token)
    .single()

  if (!data) {
    return { title: 'Recipe not found — Recipebook' }
  }

  const recipe = data.recipe_snapshot as { title: string; image?: string | null; macros?: { kcal: number }; portions?: number }
  const perPortion = recipe.portions && recipe.portions > 0 && recipe.macros
    ? Math.round(recipe.macros.kcal / recipe.portions)
    : null
  const description = perPortion
    ? `${perPortion} kcal per portion — shared via Recipebook`
    : 'Shared via Recipebook'

  return {
    title: `${recipe.title} — Recipebook`,
    description,
    openGraph: {
      title: recipe.title,
      description,
      ...(recipe.image ? { images: [{ url: recipe.image }] } : {}),
    },
  }
}

export default async function SharedRecipePage({ params }: Props) {
  const { token } = await params
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('shared_recipes')
    .select('recipe_snapshot')
    .eq('id', token)
    .single()

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-foreground mb-1">Recipe not found</h2>
          <p className="text-sm text-muted-foreground mb-4">
            This share link may have expired or been removed.
          </p>
          <Link href="/" className="text-sm text-primary font-medium hover:underline">
            Go to Recipebook
          </Link>
        </div>
      </div>
    )
  }

  return <SharedRecipePreview recipe={data.recipe_snapshot} />
}
