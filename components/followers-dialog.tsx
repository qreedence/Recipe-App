'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import useSWR from 'swr'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { FollowButton } from '@/components/follow-button'
import { useUser } from '@/hooks/use-user'
import { useFollowing } from '@/hooks/use-following'
import { createClient } from '@/lib/supabase/client'

interface FollowUser {
  userId: string
  username: string
  avatarUrl: string | null
}

async function fetchFollowers(userId: string): Promise<FollowUser[]> {
  const supabase = createClient()
  const { data: follows } = await supabase
    .from('follows')
    .select('user_id')
    .eq('target_id', userId)
  if (!follows || follows.length === 0) return []

  const { data: profiles } = await supabase
    .from('profiles')
    .select('user_id, username, avatar_url')
    .in('user_id', follows.map((f) => f.user_id))
  return (profiles ?? []).map((p) => ({ userId: p.user_id, username: p.username, avatarUrl: p.avatar_url }))
}

async function fetchFollowing(userId: string): Promise<FollowUser[]> {
  const supabase = createClient()
  const { data: follows } = await supabase
    .from('follows')
    .select('target_id')
    .eq('user_id', userId)
  if (!follows || follows.length === 0) return []

  const { data: profiles } = await supabase
    .from('profiles')
    .select('user_id, username, avatar_url')
    .in('user_id', follows.map((f) => f.target_id))
  return (profiles ?? []).map((p) => ({ userId: p.user_id, username: p.username, avatarUrl: p.avatar_url }))
}

interface FollowersDialogProps {
  userId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  initialTab: 'followers' | 'following'
}

export function FollowersDialog({ userId, open, onOpenChange, initialTab }: FollowersDialogProps) {
  const [tab, setTab] = useState(initialTab)

  useEffect(() => {
    if (open) setTab(initialTab)
  }, [open, initialTab])
  const { user } = useUser()
  const { followedUsers } = useFollowing()
  const followingIds = new Set(followedUsers.map((u) => u.userId))

  const { data: followers } = useSWR(
    open ? `followers-list-${userId}` : null,
    () => fetchFollowers(userId),
  )

  const { data: following } = useSWR(
    open ? `following-list-${userId}` : null,
    () => fetchFollowing(userId),
  )

  const list = tab === 'followers' ? followers : following

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className="sr-only">Followers and following</DialogTitle>
          <div className="flex gap-1 bg-muted rounded-lg p-1">
            <button
              onClick={() => setTab('followers')}
              className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${
                tab === 'followers'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Followers
            </button>
            <button
              onClick={() => setTab('following')}
              className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${
                tab === 'following'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Following
            </button>
          </div>
        </DialogHeader>
        <div className="max-h-80 overflow-y-auto -mx-1">
          {!list || list.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              {tab === 'followers' ? 'No followers yet' : 'Not following anyone'}
            </p>
          ) : (
            <div className="space-y-1">
              {list.map((person) => (
                <div key={person.userId} className="flex items-center gap-3 px-1 py-2">
                  <Link
                    href={`/u/${person.username}`}
                    onClick={() => onOpenChange(false)}
                    className="flex items-center gap-3 flex-1 min-w-0"
                  >
                    {person.avatarUrl ? (
                      <img src={person.avatarUrl} alt={person.username} className="w-9 h-9 rounded-full object-cover shrink-0" />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold shrink-0">
                        {person.username[0].toUpperCase()}
                      </div>
                    )}
                    <span className="text-sm font-medium text-foreground truncate">
                      {person.username}
                    </span>
                  </Link>
                  {user && user.id !== person.userId && (
                    <FollowButton
                      targetId={person.userId}
                      targetUsername={person.username}
                      initialFollowing={followingIds.has(person.userId)}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
