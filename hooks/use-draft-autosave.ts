'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { RecipeDraft } from '@/lib/types'
import { getRecipeDraft, saveRecipeDraft, deleteRecipeDraft } from '@/lib/storage'

const DEBOUNCE_MS = 1000

export function useDraftAutosave(draftKey: string) {
  const [loadedDraft, setLoadedDraft] = useState<RecipeDraft | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Load any existing draft on mount
  useEffect(() => {
    getRecipeDraft(draftKey).then((draft) => {
      setLoadedDraft(draft)
      setIsLoaded(true)
    })
  }, [draftKey])

  // Debounced save — resets the timer on every call
  const persistDraft = useCallback(
    (formState: Omit<RecipeDraft, 'id' | 'updatedAt'>) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      timeoutRef.current = setTimeout(() => {
        saveRecipeDraft({ ...formState, id: draftKey, updatedAt: Date.now() })
      }, DEBOUNCE_MS)
    },
    [draftKey],
  )

  // Clear draft — cancel any pending save, then delete
  const clearDraft = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    deleteRecipeDraft(draftKey)
  }, [draftKey])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  return { loadedDraft, isLoaded, persistDraft, clearDraft }
}
