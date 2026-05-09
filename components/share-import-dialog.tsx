'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ClipboardPaste } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

function extractShareId(input: string): string | null {
  const trimmed = input.trim()
  const urlMatch = trimmed.match(/\/recipe\/share\/([a-f0-9-]{36})/)
  if (urlMatch) return urlMatch[1]
  if (/^[a-f0-9-]{36}$/.test(trimmed)) return trimmed
  return null
}

export function ShareImportButton() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState('')

  const shareId = extractShareId(value)

  function handleOpen() {
    setValue('')
    setOpen(true)
  }

  function handleGo() {
    if (shareId) {
      setOpen(false)
      router.push(`/recipe/share/${shareId}`)
    }
  }

  return (
    <>
      <button
        onClick={handleOpen}
        className="p-2.5 rounded-lg border bg-card text-foreground border-border hover:bg-accent transition-colors duration-150"
        aria-label="Import shared recipe"
      >
        <ClipboardPaste className="h-4 w-4" />
      </button>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Import shared recipe</AlertDialogTitle>
            <AlertDialogDescription>
              Paste a share link or ID that someone sent you.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="https://... or paste ID"
            className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter' && shareId) handleGo()
            }}
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleGo} disabled={!shareId}>
              Open recipe
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export function ClipboardShareDetector() {
  const router = useRouter()
  const [detectedId, setDetectedId] = useState<string | null>(null)
  const [dismissed, setDismissed] = useState(false)

  if (typeof window !== 'undefined' && !dismissed && !detectedId) {
    const handleFocus = async () => {
      try {
        const text = await navigator.clipboard.readText()
        const id = extractShareId(text)
        if (id) setDetectedId(id)
      } catch {}
    }
    window.addEventListener('focus', handleFocus, { once: true })
  }

  function handleOpen() {
    if (detectedId) {
      router.push(`/recipe/share/${detectedId}`)
      setDetectedId(null)
    }
  }

  function handleDismiss() {
    setDetectedId(null)
    setDismissed(true)
  }

  return (
    <AlertDialog open={!!detectedId} onOpenChange={(open) => { if (!open) handleDismiss() }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Open shared recipe?</AlertDialogTitle>
          <AlertDialogDescription>
            It looks like you have a Recipebook share link on your clipboard. Would you like to open it?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleDismiss}>Dismiss</AlertDialogCancel>
          <AlertDialogAction onClick={handleOpen}>Open recipe</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
