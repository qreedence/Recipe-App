'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useUser, revalidateUser } from '@/hooks/use-user'
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'

export function UsernameSetupDialog() {
  const { user } = useUser()
  const [open, setOpen] = useState(false)
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [touched, setTouched] = useState(false)

  useEffect(() => {
    if (!user) return

    const supabase = createClient()
    supabase
      .from('profiles')
      .select('user_id')
      .eq('user_id', user.id)
      .single()
      .then(({ data }) => {
        if (!data) setOpen(true)
      })
  }, [user])

  const isUsernameValid = /^[a-zA-Z0-9][a-zA-Z0-9_-]{1,28}[a-zA-Z0-9]$/.test(username)
  const usernameError = touched && username && !isUsernameValid
    ? 'Must be 3–30 characters. Only letters, numbers, hyphens, and underscores.'
    : null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!username || !isUsernameValid) {
      setTouched(true)
      setError('Please enter a valid username')
      return
    }

    setLoading(true)
    const supabase = createClient()

    const { data: taken } = await supabase
      .from('profiles')
      .select('user_id')
      .ilike('username', username)
      .single()

    if (taken) {
      setError('Username is already taken')
      setLoading(false)
      return
    }

    const { error: insertError } = await supabase.from('profiles').insert({
      user_id: user!.id,
      username,
    })

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    setOpen(false)
    setLoading(false)
    toast.success(`Username set to @${username}`)
    revalidateUser()
  }

  return (
    <AlertDialog open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Choose a username</AlertDialogTitle>
          <AlertDialogDescription>
            Pick a username for your Recipebook profile. You can share your recipes at recipebook.app/u/your-username.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="setup-username">Username</Label>
            <Input
              id="setup-username"
              type="text"
              placeholder="e.g. chefmom"
              value={username}
              onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ''))}
              onBlur={() => setTouched(true)}
              disabled={loading}
              autoFocus
            />
            {usernameError && (
              <p className="text-xs text-destructive">{usernameError}</p>
            )}
            {error && (
              <p className="text-sm text-destructive" role="alert">{error}</p>
            )}
          </div>
          <Button type="submit" className="w-full" disabled={loading || !username || !isUsernameValid}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Set username'}
          </Button>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  )
}
