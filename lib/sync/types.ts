import type { SyncableTable } from '@/lib/supabase/database.types'

export type SyncOperation = 'upsert' | 'delete'

// One row in the Dexie `pendingWrites` table. The drain worker pops these
// oldest-first and hands each to the registered dispatcher for the target table.
export interface PendingWrite {
  id?: number // auto-increment; undefined before insert
  table: SyncableTable
  operation: SyncOperation
  // Client-provided natural key for the row. For deletes this is all the dispatcher
  // gets; for upserts it's redundant with the payload but useful for dedup/logging.
  rowKey: string
  // Upsert payload: a ready-to-send row in Postgres shape (snake_case columns).
  // For deletes: null.
  payload: Record<string, unknown> | null
  createdAt: number
  attemptCount: number
  lastError: string | null
}
