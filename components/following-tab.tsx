'use client'

import Link from 'next/link'
import { Drumstick, Flame, Users } from 'lucide-react'
import { useFollowing } from '@/hooks/use-following'

export function FollowingTab() {
  const { followedUsers, isLoading } = useFollowing()

  if (isLoading) return null

  if (followedUsers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <Users className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="text-lg font-semibold text-foreground mb-1">Not following anyone</h2>
        <p className="text-sm text-muted-foreground max-w-xs">
          When someone shares their profile with you, visit it and tap Follow to see their recipes here.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {followedUsers.map((user) => (
        <section key={user.userId}>
          <Link
            href={`/u/${user.username}`}
            className="flex items-center gap-2.5 mb-3 group"
          >
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.username} className="w-8 h-8 rounded-full object-cover" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                {user.username[0].toUpperCase()}
              </div>
            )}
            <h2 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
              {user.username}
            </h2>
            <span className="text-xs text-muted-foreground">
              {user.recipes.length} {user.recipes.length === 1 ? 'recipe' : 'recipes'}
            </span>
          </Link>
          {user.recipes.length === 0 ? (
            <p className="text-sm text-muted-foreground pl-10">No recipes yet.</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {user.recipes.map((recipe) => {
                const perPortion = {
                  kcal: recipe.portions > 0 ? Math.round(recipe.macros.kcal / recipe.portions) : 0,
                  protein: recipe.portions > 0 ? Math.round(recipe.macros.protein / recipe.portions) : 0,
                }

                return (
                  <Link
                    key={recipe.id}
                    href={`/u/${user.username}/${recipe.id}`}
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
        </section>
      ))}
    </div>
  )
}
