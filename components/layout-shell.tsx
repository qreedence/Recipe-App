"use client"

import { usePathname } from "next/navigation"

export function LayoutShell({ children }: { children: React.ReactNode }) {
  const isDetailPage = usePathname().startsWith("/recipe/")
  return (
    <div className={isDetailPage ? "" : "lg:pl-56"}>
      {children}
    </div>
  )
}