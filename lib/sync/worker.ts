import { createClient } from '@/lib/supabase/client'
import type { SyncableTable } from '@/lib/supabase/database'
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

export type SyncError = {
  table: SyncableTable
  operation: string
  rowKey: string
  message: string
}

let draining = false
const syncErrors: SyncError[] = []
const reportedKeys = new Set<string>()

export function getSyncErrors(): SyncError[] {
  return syncErrors.splice(0)
}

export function clearSyncErrors(): void {
  syncErrors.length = 0
}

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
      if (!dispatcher) continue
      if (write.attemptCount >= MAX_ATTEMPTS) {
        const key = `${write.table}:${write.rowKey}`
        if (write.lastError && !reportedKeys.has(key)) {
          reportedKeys.add(key)
          syncErrors.push({
            table: write.table,
            operation: write.operation,
            rowKey: write.rowKey,
            message: write.lastError,
          })
        }
        continue
      }
      try {
        await dispatcher(write)
        if (write.id !== undefined) await remove(write.id)
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        if (write.id !== undefined) await markFailed(write.id, message)
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
