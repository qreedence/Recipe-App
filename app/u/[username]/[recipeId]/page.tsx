import { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { SharedRecipePreview } from '@/components/shared-recipe-preview'

type Props = {
  params: Promise<{ username: string; recipeId: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username, recipeId } = await params
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('user_id, username, is_public')
    .ilike('username', username)
    .single()

  if (!profile || !profile.is_public) return { title: 'Recipe not found — Recipebook' }

  const { data: recipe } = await supabase
    .from('recipes')
    .select('title, image, macros, portions')
    .eq('id', recipeId)
    .eq('user_id', profile.user_id)
    .single()

  if (!recipe) return { title: 'Recipe not found — Recipebook' }

  const macros = recipe.macros as { kcal: number } | null
  const perPortion = recipe.portions > 0 && macros ? Math.round(macros.kcal / recipe.portions) : null
  const description = perPortion
    ? `${perPortion} kcal per portion — by ${profile.username} on Recipebook`
    : `By ${profile.username} on Recipebook`

  return {
    title: `${recipe.title} — ${profile.username} — Recipebook`,
    description,
    openGraph: {
      title: recipe.title,
      description,
      ...(recipe.image ? { images: [{ url: recipe.image as string }] } : {}),
    },
  }
}

export default async function ProfileRecipePage({ params }: Props) {
  const { username, recipeId } = await params
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('user_id, username, is_public')
    .ilike('username', username)
    .single()

  if (!profile || !profile.is_public) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-foreground mb-1">Recipe not found</h2>
          <p className="text-sm text-muted-foreground mb-4">
            This recipe is not available.
          </p>
          <Link href="/" className="text-sm text-primary font-medium hover:underline">
            Go to Recipebook
          </Link>
        </div>
      </div>
    )
  }

  const { data: recipe } = await supabase
    .from('recipes')
    .select('*')
    .eq('id', recipeId)
    .eq('user_id', profile.user_id)
    .single()

  if (!recipe) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-foreground mb-1">Recipe not found</h2>
          <p className="text-sm text-muted-foreground mb-4">
            This recipe may have been deleted.
          </p>
          <Link href={`/u/${profile.username}`} className="text-sm text-primary font-medium hover:underline">
            Back to {profile.username}&apos;s recipes
          </Link>
        </div>
      </div>
    )
  }

  const { user_id, updated_at, ...snapshot } = recipe

  return <SharedRecipePreview recipe={snapshot} backHref={`/u/${profile.username}`} />
}
