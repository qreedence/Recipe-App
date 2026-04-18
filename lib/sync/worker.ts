import { createClient } from '@/lib/supabase/client'
import type { SyncableTable } from '@/lib/supabase/database.types'
import { markFailed, peekAll, remove } from './queue'
import type { PendingWrite } from './types'

// A dispatcher knows how to execute one pending write against Supabase for its
// registered table. Per-entity sync modules (PR #3) register these.
export type SyncDispatcher = (write: PendingWrite) => Promise<void>

const dispatchers = new Map<SyncableTable, SyncDispatcher>()

export function registerSyncDispatcher(
  table: SyncableTable,
  dispatcher: SyncDispatcher,
): void {
  dispatchers.set(table, dispatcher)
}

const MAX_ATTEMPTS = 5

let draining = false

// Drains the pending-writes queue serially. Returns when the queue is empty,
// when we hit an item with no dispatcher, or when we hit a failure we want to
// retry later. Safe to call concurrently — duplicate calls are deduped.
export async function drain(): Promise<void> {
  if (draining) return
  if (typeof navigator !== 'undefined' && !navigator.onLine) return

  const supabase = createClient()
  const { data } = await supabase.auth.getUser()
  if (!data.user) return

  draining = true
  try {
    const queue = await peekAll()
    for (const write of queue) {
      const dispatcher = dispatchers.get(write.table)
      if (!dispatcher) {
        // No handler registered yet — skip the rest of the queue; a later drain
        // will pick it up once the per-entity module registers.
        break
      }
      if (write.attemptCount >= MAX_ATTEMPTS) {
        // Give up; later retries will re-enqueue if the user repeats the op.
        // The failed row stays in the queue for diagnostics.
        continue
      }
      try {
        await dispatcher(write)
        if (write.id !== undefined) await remove(write.id)
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        if (write.id !== undefined) await markFailed(write.id, message)
        // Stop the drain — preserve order, retry later.
        break
      }
    }
  } finally {
    draining = false
  }
}

// Auto-trigger drains when the browser comes online or the user signs in.
// Idempotent; safe to call multiple times. Returns an unsubscribe function.
export function startSyncWorker(): () => void {
  if (typeof window === 'undefined') return () => {}

  const supabase = createClient()

  const onOnline = () => {
    void drain()
  }
  window.addEventListener('online', onOnline)

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
      void drain()
    }
  })

  // Best-effort drain on startup in case the queue has items from a prior session.
  void drain()

  return () => {
    window.removeEventListener('online', onOnline)
    subscription.unsubscribe()
  }
}
