import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SettingsPage } from '@/components/settings-page'

export const metadata = {
  title: 'Settings · Recipebook',
}

export default async function AccountPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?redirectTo=/account')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('username, is_public, avatar_url')
    .eq('user_id', user.id)
    .single()

  return (
    <SettingsPage
      email={user.email ?? ''}
      initialUsername={profile?.username ?? ''}
      initialIsPublic={profile?.is_public ?? false}
      initialAvatarUrl={profile?.avatar_url ?? null}
    />
  )
}
