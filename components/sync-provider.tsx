'use client'

import { useEffect } from 'react'
import { mutate as globalMutate } from 'swr'
import { useUser } from '@/hooks/use-user'
import { setCurrentUserId } from '@/lib/supabase/session'
import { drain, startSyncWorker } from '@/lib/sync/worker'
import { hydrateRecipesFromCloud, migrateLocalRecipesToCloud } from '@/lib/sync/recipes-sync'

// Mounts once at the root layout. Keeps the non-React session id in sync with
// auth state, starts the background sync worker when signed in, and triggers
// per-entity hydration so Dexie picks up writes made on other devices.

export function SyncProvider() {
  const { user } = useUser()

  useEffect(() => {
    setCurrentUserId(user?.id ?? null)

    if (!user) return

    let cancelled = false

    const run = async () => {
      await drain()
      if (cancelled) return
      await migrateLocalRecipesToCloud()
      if (cancelled) return
      await drain()
      if (cancelled) return
      await hydrateRecipesFromCloud()
      if (cancelled) return
      await globalMutate('recipes')
    }
    void run()

    const stopWorker = startSyncWorker()
    return () => {
      cancelled = true
      stopWorker()
    }
  }, [user])

  return null
}
