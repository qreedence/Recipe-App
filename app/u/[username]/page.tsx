import { Metadata } from 'next'
import Link from 'next/link'
import { BookOpen, Drumstick, Flame } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

type Props = {
  params: Promise<{ username: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('username')
    .ilike('username', username)
    .single()

  if (!profile) return { title: 'User not found — Recipebook' }

  return {
    title: `${profile.username}'s recipes — Recipebook`,
    description: `Browse ${profile.username}'s recipe collection on Recipebook`,
    openGraph: {
      title: `${profile.username}'s recipes`,
      description: `Browse ${profile.username}'s recipe collection on Recipebook`,
    },
  }
}

export default async function ProfilePage({ params }: Props) {
  const { username } = await params
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('user_id, username, is_public')
    .ilike('username', username)
    .single()

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-foreground mb-1">User not found</h2>
          <p className="text-sm text-muted-foreground mb-4">
            No user with that username exists.
          </p>
          <Link href="/" className="text-sm text-primary font-medium hover:underline">
            Go to Recipebook
          </Link>
        </div>
      </div>
    )
  }

  if (!profile.is_public) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-foreground mb-1">Private profile</h2>
          <p className="text-sm text-muted-foreground mb-4">
            {profile.username}&apos;s recipes are not public.
          </p>
          <Link href="/" className="text-sm text-primary font-medium hover:underline">
            Go to Recipebook
          </Link>
        </div>
      </div>
    )
  }

  const { data: recipes } = await supabase
    .from('recipes')
    .select('id, title, portions, image, macros, rating, tags, created_at')
    .eq('user_id', profile.user_id)
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-6">
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">
              {profile.username[0].toUpperCase()}
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">{profile.username}</h1>
              <p className="text-xs text-muted-foreground">
                {recipes?.length ?? 0} {(recipes?.length ?? 0) === 1 ? 'recipe' : 'recipes'}
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        {!recipes || recipes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <BookOpen className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-semibold text-foreground mb-1">No recipes yet</h2>
            <p className="text-sm text-muted-foreground">
              {profile.username} hasn&apos;t added any recipes.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {recipes.map((recipe) => {
              const macros = recipe.macros as { kcal: number; protein: number } | null
              const perPortion = {
                kcal: recipe.portions > 0 && macros ? Math.round(macros.kcal / recipe.portions) : 0,
                protein: recipe.portions > 0 && macros ? Math.round(macros.protein / recipe.portions) : 0,
              }

              return (
                <Link
                  key={recipe.id}
                  href={`/u/${profile.username}/${recipe.id}`}
                  className="group block"
                >
                  <div className="overflow-hidden rounded-xl bg-card border border-border">
                    <div className="aspect-[4/3] bg-muted relative overflow-hidden">
                      {recipe.image ? (
                        <img
                          src={recipe.image}
                          alt={recipe.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          <Drumstick className="h-10 w-10" />
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <h3 className="font-semibold text-sm text-card-foreground leading-tight line-clamp-2 text-balance">
                        {recipe.title}
                      </h3>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Flame className="h-3 w-3" />
                          {perPortion.kcal} kcal
                        </span>
                        <span>{perPortion.protein}g protein</span>
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
