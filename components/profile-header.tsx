'use client'

import { useState, useRef } from 'react'
import { Camera } from 'lucide-react'
import { toast } from 'sonner'
import { useUser, revalidateUser } from '@/hooks/use-user'
import { createClient } from '@/lib/supabase/client'
import { FollowButton } from '@/components/follow-button'
import { FollowersDialog } from '@/components/followers-dialog'
import useSWR from 'swr'

interface ProfileStats {
  username: string
  avatarUrl: string | null
  recipeCount: number
  followerCount: number
  followingCount: number
}

async function fetchProfileStats(userId: string): Promise<ProfileStats | null> {
  const supabase = createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('username, avatar_url')
    .eq('user_id', userId)
    .single()

  if (!profile) return null

  const [{ count: recipeCount }, { count: followerCount }, { count: followingCount }] =
    await Promise.all([
      supabase.from('recipes').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      supabase.from('follows').select('*', { count: 'exact', head: true }).eq('target_id', userId),
      supabase.from('follows').select('*', { count: 'exact', head: true }).eq('user_id', userId),
    ])

  return {
    username: profile.username,
    avatarUrl: profile.avatar_url,
    recipeCount: recipeCount ?? 0,
    followerCount: followerCount ?? 0,
    followingCount: followingCount ?? 0,
  }
}

interface ProfileHeaderProps {
  userId?: string
  readOnly?: boolean
  compact?: boolean
}

export function ProfileHeader({ userId, readOnly = false, compact = false }: ProfileHeaderProps) {
  const { user } = useUser()
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogTab, setDialogTab] = useState<'followers' | 'following'>('followers')

  const targetId = userId ?? user?.id
  const isOwnProfile = !userId || userId === user?.id

  const { data: stats, mutate } = useSWR(
    targetId ? `profile-stats-${targetId}` : null,
    () => fetchProfileStats(targetId!),
    { revalidateOnFocus: true },
  )

  const { data: followState } = useSWR(
    readOnly && user && targetId && !isOwnProfile ? `follow-state-${targetId}` : null,
    async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('follows')
        .select('user_id')
        .eq('user_id', user!.id)
        .eq('target_id', targetId!)
        .single()
      return !!data
    },
  )

  if (!targetId) return null

  if (!stats) {
    return (
      <div className={`flex items-center gap-4${compact ? '' : ' mb-4'}`}>
        <div className="w-16 h-16 rounded-full bg-accent animate-pulse shrink-0" />
        <div className="space-y-2">
          <div className="h-4 w-24 rounded bg-accent animate-pulse" />
          <div className="h-3 w-40 rounded bg-accent animate-pulse" />
        </div>
      </div>
    )
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''

    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/avatar/upload', {
        method: 'POST',
        body: formData,
      })
      if (!res.ok) throw new Error()
      toast.success('Avatar updated!')
      mutate()
      revalidateUser()
    } catch {
      toast.error('Failed to upload avatar')
    } finally {
      setUploading(false)
    }
  }

  const avatarContent = stats.avatarUrl ? (
    <img
      src={stats.avatarUrl}
      alt={stats.username}
      className="w-16 h-16 rounded-full object-cover"
    />
  ) : (
    <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xl font-bold">
      {stats.username[0].toUpperCase()}
    </div>
  )

  return (
    <div className={`flex items-center gap-4${compact ? '' : ' mb-4'}`}>
      {readOnly ? (
        <div className="shrink-0">{avatarContent}</div>
      ) : (
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="relative shrink-0 group"
          aria-label="Change avatar"
        >
          {avatarContent}
          <div className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
            <Camera className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
          />
        </button>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-base font-semibold text-foreground truncate">{stats.username}</p>
          {readOnly && !isOwnProfile && followState !== undefined && (
            <FollowButton
              targetId={targetId}
              targetUsername={stats.username}
              initialFollowing={followState}
            />
          )}
        </div>
        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
          <span><span className="font-semibold text-foreground">{stats.recipeCount}</span> recipes</span>
          <button
            onClick={() => { setDialogTab('followers'); setDialogOpen(true) }}
            className="hover:text-foreground transition-colors"
          >
            <span className="font-semibold text-foreground">{stats.followerCount}</span> followers
          </button>
          <button
            onClick={() => { setDialogTab('following'); setDialogOpen(true) }}
            className="hover:text-foreground transition-colors"
          >
            <span className="font-semibold text-foreground">{stats.followingCount}</span> following
          </button>
        </div>
      </div>
      <FollowersDialog
        userId={targetId}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initialTab={dialogTab}
      />
    </div>
  )
}
