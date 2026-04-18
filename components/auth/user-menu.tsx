'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { LogIn, LogOut, User as UserIcon } from 'lucide-react'
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

export function UserMenu() {
  const router = useRouter()
  const { user, loading } = useUser()

  if (loading) {
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
      <DropdownMenuTrigger className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <UserIcon className="h-5 w-5" strokeWidth={2} />
        <span className="truncate">{displayName}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side="top" className="w-56">
        <DropdownMenuLabel className="truncate">{displayName}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/account">
            <UserIcon className="h-4 w-4" />
            Account
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
