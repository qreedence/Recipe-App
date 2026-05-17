'use client'

import { useEffect } from 'react'
import type { User } from '@supabase/supabase-js'
import useSWR, { mutate as globalMutate } from 'swr'
import { createClient } from '@/lib/supabase/client'

interface UserProfile {
  user: User
  username: string
  avatarUrl: string | null
  isPublic: boolean
}

async function fetchUser(): Promise<UserProfile | null> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('username, avatar_url, is_public')
    .eq('user_id', user.id)
    .single()

  return {
    user,
    username: profile?.username ?? '',
    avatarUrl: profile?.avatar_url ?? null,
    isPublic: profile?.is_public ?? false,
  }
}

const KEY = 'current-user'

export function useUser() {
  const { data, isLoading } = useSWR(KEY, fetchUser, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 60000,
  })

  useEffect(() => {
    const supabase = createClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      globalMutate(KEY)
    })
    return () => subscription.unsubscribe()
  }, [])

  return {
    user: data?.user ?? null,
    username: data?.username ?? '',
    avatarUrl: data?.avatarUrl ?? null,
    isPublic: data?.isPublic ?? false,
    loading: isLoading,
  }
}

export function revalidateUser() {
  return globalMutate(KEY)
}
