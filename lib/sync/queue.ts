import { db } from '@/lib/db'
import type { PendingWrite, SyncOperation } from './types'
import type { SyncableTable } from '@/lib/supabase/database.types'

export async function enqueue(
  table: SyncableTable,
  operation: SyncOperation,
  rowKey: string,
  payload: Record<string, unknown> | null,
): Promise<void> {
  const entry: Omit<PendingWrite, 'id'> = {
    table,
    operation,
    rowKey,
    payload,
    createdAt: Date.now(),
    attemptCount: 0,
    lastError: null,
  }
  await db.pendingWrites.add(entry as PendingWrite)
}

// Returns writes oldest-first so the drain worker replays in user-order.
export async function peekAll(): Promise<PendingWrite[]> {
  return db.pendingWrites.orderBy('id').toArray()
}

export async function remove(id: number): Promise<void> {
  await db.pendingWrites.delete(id)
}

export async function markFailed(id: number, error: string): Promise<void> {
  await db.pendingWrites
    .where('id')
    .equals(id)
    .modify((entry) => {
      entry.attemptCount += 1
      entry.lastError = error
    })
}

export async function count(): Promise<number> {
  return db.pendingWrites.count()
}

export async function clear(): Promise<void> {
  await db.pendingWrites.clear()
}

export async function retryAllFailed(): Promise<void> {
  await db.pendingWrites
    .where('attemptCount')
    .aboveOrEqual(1)
    .modify({ attemptCount: 0, lastError: null })
}

export async function purgeExhausted(maxAttempts: number): Promise<void> {
  await db.pendingWrites
    .where('attemptCount')
    .aboveOrEqual(maxAttempts)
    .delete()
}
