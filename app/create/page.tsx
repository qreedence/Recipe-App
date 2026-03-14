'use client'

import { RecipeForm } from '@/components/create/recipe-form'
import { useDraftAutosave } from '@/hooks/use-draft-autosave'

export default function CreatePage() {
  const { loadedDraft, isLoaded, persistDraft, clearDraft } = useDraftAutosave('create')

  if (!isLoaded) return null

  return (
    <RecipeForm
      mode="create"
      initialDraft={loadedDraft}
      onPersistDraft={persistDraft}
      onClearDraft={clearDraft}
    />
  )
}
