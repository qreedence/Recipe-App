"use client"

import { usePathname } from "next/navigation"

export function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isDetailPage = pathname.startsWith("/recipe/")
  const isAuthPage = pathname === "/login" || pathname === "/signup"
  const skipSidebar = isDetailPage || isAuthPage
  return (
    <div className={skipSidebar ? "" : "lg:pl-56"}>
      {children}
    </div>
  )
}