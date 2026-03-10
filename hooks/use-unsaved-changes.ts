"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"

export function useUnsavedChanges(isDirty: boolean) {
  const router = useRouter()
  const [showDialog, setShowDialog] = useState(false)
  const [pendingHref, setPendingHref] = useState<string | null>(null)
  const guardPushedRef = useRef(false)
  const isDirtyRef = useRef(isDirty)

  // Keep ref in sync for use inside event handlers
  isDirtyRef.current = isDirty

  // 1. Browser refresh / tab close
  useEffect(() => {
    if (!isDirty) return

    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
    }

    window.addEventListener("beforeunload", handler)
    return () => window.removeEventListener("beforeunload", handler)
  }, [isDirty])

  // 2. Browser back/forward button
  useEffect(() => {
    if (!isDirty) {
      // Clean up guard entry if we pushed one (e.g. form was saved)
      if (guardPushedRef.current) {
        history.back()
        guardPushedRef.current = false
      }
      return
    }

    // Push a dummy history entry so back button hits us first
    if (!guardPushedRef.current) {
      history.pushState({ navGuard: true }, "")
      guardPushedRef.current = true
    }

    const handler = () => {
      if (!isDirtyRef.current) return

      // Re-push guard entry to stay on page
      history.pushState({ navGuard: true }, "")

      setPendingHref("__back__")
      setShowDialog(true)
    }

    window.addEventListener("popstate", handler)
    return () => window.removeEventListener("popstate", handler)
  }, [isDirty])

  // 3. In-app navigation guard
  const guardNavigation = useCallback(
    (href: string) => {
      if (!isDirty) {
        router.push(href)
        return
      }
      setPendingHref(href)
      setShowDialog(true)
    },
    [isDirty, router]
  )

  const confirmLeave = useCallback(() => {
    setShowDialog(false)
    guardPushedRef.current = false

    if (pendingHref === "__back__") {
      // Go back past our guard entry (already popped) + the real entry
      history.back()
    } else if (pendingHref) {
      router.push(pendingHref)
    }

    setPendingHref(null)
  }, [pendingHref, router])

  const cancelLeave = useCallback(() => {
    setShowDialog(false)
    setPendingHref(null)
  }, [])

  return { showDialog, guardNavigation, confirmLeave, cancelLeave }
}