'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { LogIn, LogOut, Settings } from 'lucide-react'
import { toast } from 'sonner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useUser } from '@/hooks/use-user'
import { createClient } from '@/lib/supabase/client'

export function UserMenu({ variant = 'sidebar' }: { variant?: 'sidebar' | 'compact' }) {
  const router = useRouter()
  const { user, loading } = useUser()

  const isCompact = variant === 'compact'

  if (loading) {
    if (isCompact) {
      return <div className="h-9 w-9 rounded-lg bg-accent animate-pulse" />
    }
    return (
      <div
        aria-hidden
        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground"
      >
        <div className="h-5 w-5 rounded-full bg-accent animate-pulse" />
        <div className="h-3 w-20 rounded bg-accent animate-pulse" />
      </div>
    )
  }

  if (!user) {
    if (isCompact) {
      return (
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gradient-to-r from-orange-500 to-orange-400 hover:from-orange-600 hover:to-orange-500 text-white text-sm font-medium whitespace-nowrap shrink-0 transition-colors duration-150"
        >
          <LogIn className="h-4 w-4" />
          Sign in
        </Link>
      )
    }
    return (
      <Link
        href="/login"
        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors duration-150"
      >
        <LogIn className="h-5 w-5" strokeWidth={2} />
        Sign in
      </Link>
    )
  }

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    toast.success('Signed out')
    router.push('/')
    router.refresh()
  }

  const displayName = user.email ?? 'Account'

  return (
    <DropdownMenu>
      {isCompact ? (
        <DropdownMenuTrigger
          className="p-2.5 rounded-lg border bg-card text-foreground border-border hover:bg-accent transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Account menu"
        >
          <Settings className="h-4 w-4" />
        </DropdownMenuTrigger>
      ) : (
        <DropdownMenuTrigger className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <Settings className="h-5 w-5" strokeWidth={2} />
          <span className="truncate">{displayName}</span>
        </DropdownMenuTrigger>
      )}
      <DropdownMenuContent
        align={isCompact ? 'end' : 'start'}
        side={isCompact ? 'bottom' : 'top'}
        className="w-56"
      >
        <DropdownMenuLabel className="truncate">{displayName}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/account">
            <Settings className="h-4 w-4" />
            Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleSignOut}>
          <LogOut className="h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
