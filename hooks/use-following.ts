import useSWR from 'swr'
import { createClient } from '@/lib/supabase/client'
import { useUser } from './use-user'

interface FollowedUser {
  userId: string
  username: string
  avatarUrl: string | null
  recipes: {
    id: string
    title: string
    portions: number
    image: string | null
    macros: { kcal: number; protein: number }
    rating: number | null
    tags: string[]
  }[]
}

async function fetchFollowing(userId: string): Promise<FollowedUser[]> {
  const supabase = createClient()

  const { data: follows } = await supabase
    .from('follows')
    .select('target_id')
    .eq('user_id', userId)

  if (!follows || follows.length === 0) return []

  const targetIds = follows.map((f) => f.target_id)

  const { data: profiles } = await supabase
    .from('profiles')
    .select('user_id, username, is_public, avatar_url')
    .in('user_id', targetIds)

  if (!profiles) return []

  const publicProfiles = profiles.filter((p) => p.is_public)
  if (publicProfiles.length === 0) return []

  const { data: recipes } = await supabase
    .from('recipes')
    .select('id, user_id, title, portions, image, macros, rating, tags')
    .in('user_id', publicProfiles.map((p) => p.user_id))
    .order('created_at', { ascending: false })

  return publicProfiles.map((profile) => ({
    userId: profile.user_id,
    username: profile.username,
    avatarUrl: profile.avatar_url,
    recipes: (recipes ?? [])
      .filter((r) => r.user_id === profile.user_id)
      .map((r) => ({
        id: r.id,
        title: r.title,
        portions: r.portions,
        image: r.image,
        macros: r.macros as { kcal: number; protein: number },
        rating: r.rating,
        tags: r.tags as string[],
      })),
  }))
}

export function useFollowing() {
  const { user } = useUser()

  const { data, error, isLoading } = useSWR(
    user ? `following-${user.id}` : null,
    () => fetchFollowing(user!.id),
    { fallbackData: [], revalidateOnFocus: true },
  )

  return {
    followedUsers: data ?? [],
    isLoading,
    error,
  }
}
