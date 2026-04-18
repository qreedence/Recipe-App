import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { SignOutButton } from '@/components/auth/sign-out-button'

export const metadata = {
  title: 'Account · Recipebook',
}

export default async function AccountPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?redirectTo=/account')
  }

  return (
    <main className="min-h-[100dvh] px-4 py-8 max-w-lg mx-auto">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Link>
      <h1 className="text-2xl font-semibold mb-6">Account</h1>
      <dl className="space-y-4 mb-8">
        <div>
          <dt className="text-sm text-muted-foreground">Email</dt>
          <dd className="text-sm">{user.email}</dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">User ID</dt>
          <dd className="text-xs font-mono text-muted-foreground break-all">{user.id}</dd>
        </div>
      </dl>
      <SignOutButton />
    </main>
  )
}
