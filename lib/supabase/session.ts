// Tracks the currently signed-in user id for non-React code (storage layer,
// sync worker) that can't reach into a React context. Updated by SyncProvider
// on auth state changes.

let currentUserId: string | null = null

export function getCurrentUserId(): string | null {
  return currentUserId
}

export function setCurrentUserId(id: string | null): void {
  currentUserId = id
}
