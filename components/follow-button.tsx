'use client'

import { useState } from 'react'
import { UserPlus, UserCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useUser } from '@/hooks/use-user'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface FollowButtonProps {
  targetId: string
  targetUsername: string
  initialFollowing: boolean
}

export function FollowButton({ targetId, targetUsername, initialFollowing }: FollowButtonProps) {
  const { user } = useUser()
  const router = useRouter()
  const [following, setFollowing] = useState(initialFollowing)
  const [loading, setLoading] = useState(false)

  if (!user || user.id === targetId) return null

  async function handleToggle() {
    setLoading(true)
    const supabase = createClient()

    if (following) {
      await supabase.from('follows').delete().eq('user_id', user!.id).eq('target_id', targetId)
      setFollowing(false)
    } else {
      await supabase.from('follows').insert({ user_id: user!.id, target_id: targetId })
      setFollowing(true)
    }

    setLoading(false)
    router.refresh()
  }

  return following ? (
    <Button
      variant="outline"
      size="sm"
      onClick={handleToggle}
      disabled={loading}
    >
      <UserCheck className="h-4 w-4 mr-1.5" />
      Following
    </Button>
  ) : (
    <Button
      size="sm"
      onClick={handleToggle}
      disabled={loading}
      className="bg-gradient-to-r from-orange-500 to-orange-400 hover:from-orange-600 hover:to-orange-500"
    >
      <UserPlus className="h-4 w-4 mr-1.5" />
      Follow
    </Button>
  )
}
