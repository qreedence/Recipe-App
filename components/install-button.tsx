"use client"

import { useState, useEffect } from "react"
import { Download, Share, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"

function isIOSSafari() {
  if (typeof navigator === "undefined") return false
  const ua = navigator.userAgent
  const isIOS =
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|OPiOS|EdgiOS/.test(ua)
  return isIOS && isSafari
}

export function InstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isIOS, setIsIOS] = useState(false)

  useEffect(() => {
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true)
      return
    }

    if (isIOSSafari()) {
      setIsIOS(true)
      return
    }

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }

    window.addEventListener("beforeinstallprompt", handler)
    return () => window.removeEventListener("beforeinstallprompt", handler)
  }, [])

  if (isInstalled) return null
  if (!isIOS && !deferredPrompt) return null

  async function handleInstall() {
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === "accepted") {
      setDeferredPrompt(null)
    }
  }

  const steps = [
    {
      icon: Share,
      title: "Tap the Share button",
      description: "In the Safari toolbar at the bottom of the screen",
    },
    {
      icon: Plus,
      title: 'Tap "Add to Home Screen"',
      description: "Scroll down in the share menu if you don't see it",
    },
    {
      icon: Download,
      title: 'Tap "Add"',
      description: "The app will appear on your home screen",
    },
  ]

  if (isIOS) {
    return (
      <Drawer>
        <DrawerTrigger asChild>
          <Button className="bg-gradient-to-r from-orange-500 to-orange-400 hover:from-orange-600 hover:to-orange-500">
            <Download className="h-4 w-4" />
            Install App
          </Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Install Recipebook</DrawerTitle>
            <DrawerDescription>
              Add this app to your home screen for the best experience.
            </DrawerDescription>
          </DrawerHeader>
          <div className="space-y-5 px-4 pb-8">
            {steps.map((step) => (
              <div key={step.title} className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center">
                  <step.icon className="h-4 w-4 text-orange-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{step.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Button
      onClick={handleInstall}
      className="bg-gradient-to-r from-orange-500 to-orange-400 hover:from-orange-600 hover:to-orange-500"
    >
      <Download className="h-4 w-4" />
      Install App
    </Button>
  )
}