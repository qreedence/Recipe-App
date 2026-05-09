'use client'

import { useEffect } from 'react'
import { mutate as globalMutate } from 'swr'
import { toast } from 'sonner'
import { useUser } from '@/hooks/use-user'
import { setCurrentUserId } from '@/lib/supabase/session'
import { drain, startSyncWorker, getSyncErrors, clearSyncErrors } from '@/lib/sync/worker'
import { purgeExhausted } from '@/lib/sync/queue'
import { hydrateRecipesFromCloud, migrateLocalRecipesToCloud } from '@/lib/sync/recipes-sync'
import { hydrateShoppingFromCloud, migrateLocalShoppingToCloud } from '@/lib/sync/shopping-sync'
import { hydrateMealPlanFromCloud, migrateLocalMealPlanToCloud } from '@/lib/sync/meal-plan-sync'
import { hydrateMealTypeConfigFromCloud, migrateLocalMealTypeConfigToCloud } from '@/lib/sync/meal-type-config-sync'

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
      await migrateLocalShoppingToCloud()
      await migrateLocalMealPlanToCloud()
      await migrateLocalMealTypeConfigToCloud()
      if (cancelled) return

      await drain()
      if (cancelled) return

      const errors = getSyncErrors()
      if (errors.length > 0) {
        for (const err of errors) {
          toast.error(`Sync failed: ${err.table} ${err.operation} (${err.rowKey})`, {
            description: err.message,
            duration: Infinity,
          })
        }
        clearSyncErrors()
        await purgeExhausted(5)
      }

      await hydrateRecipesFromCloud()
      await hydrateShoppingFromCloud()
      await hydrateMealPlanFromCloud()
      await hydrateMealTypeConfigFromCloud()
      if (cancelled) return

      await globalMutate('recipes')
      await globalMutate('shopping-items')
      await globalMutate((key) => typeof key === 'string' && key.startsWith('meal-plan-'), undefined, { revalidate: true })
      await globalMutate('meal-type-config')
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
