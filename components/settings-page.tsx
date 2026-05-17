'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Loader2, Check } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SignOutButton } from '@/components/auth/sign-out-button'
import { createClient } from '@/lib/supabase/client'

interface SettingsPageProps {
  email: string
  initialUsername: string
  initialIsPublic: boolean
}

export function SettingsPage({ email, initialUsername, initialIsPublic }: SettingsPageProps) {
  const [username, setUsername] = useState(initialUsername)
  const [isPublic, setIsPublic] = useState(initialIsPublic)
  const [saving, setSaving] = useState(false)

  const usernameError = username && !/^[a-zA-Z0-9][a-zA-Z0-9_-]{1,28}[a-zA-Z0-9]$/.test(username)
    ? 'Letters, numbers, hyphens, underscores. 3–30 chars.'
    : null

  const hasChanges = username !== initialUsername || isPublic !== initialIsPublic

  async function handleSave() {
    if (!username || usernameError) return

    setSaving(true)
    const supabase = createClient()

    if (username !== initialUsername) {
      const { data: taken } = await supabase
        .from('profiles')
        .select('user_id')
        .ilike('username', username)
        .single()

      if (taken) {
        toast.error('Username is already taken')
        setSaving(false)
        return
      }
    }

    const { error } = await supabase
      .from('profiles')
      .update({ username, is_public: isPublic })
      .eq('username', initialUsername)

    if (error) {
      toast.error(error.message)
      setSaving(false)
      return
    }

    toast.success('Settings saved')
    setSaving(false)
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
      <h1 className="text-2xl font-semibold mb-6">Settings</h1>

      <div className="space-y-6">
        <div>
          <Label className="text-sm text-muted-foreground">Email</Label>
          <p className="text-sm mt-1">{email}</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ''))}
          />
          {usernameError && (
            <p className="text-xs text-destructive">{usernameError}</p>
          )}
          {username && !usernameError && (
            <p className="text-xs text-muted-foreground">
              Your profile: /u/{username}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="public-toggle">Public profile</Label>
            <p className="text-xs text-muted-foreground mt-0.5">
              Allow others to browse your recipes
            </p>
          </div>
          <button
            id="public-toggle"
            role="switch"
            aria-checked={isPublic}
            onClick={() => setIsPublic(!isPublic)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              isPublic ? 'bg-primary' : 'bg-border'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                isPublic ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {hasChanges && (
          <Button
            onClick={handleSave}
            disabled={saving || !username || !!usernameError}
            className="w-full"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : (
              <>
                <Check className="h-4 w-4 mr-1.5" />
                Save changes
              </>
            )}
          </Button>
        )}

        <div className="pt-4 border-t border-border">
          <SignOutButton />
        </div>
      </div>
    </main>
  )
}
