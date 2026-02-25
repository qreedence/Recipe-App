"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { BookOpen, PlusCircle, ShoppingCart } from "lucide-react"

const NAV_ITEMS = [
  { href: "/", label: "Recipes", icon: BookOpen },
  { href: "/create", label: "Create", icon: PlusCircle },
  { href: "/shopping", label: "Shopping", icon: ShoppingCart },
]

export function AppNav() {
  const pathname = usePathname()

  // Hide nav on recipe detail pages — the detail view has its own back nav
  const isDetailPage = pathname.startsWith("/recipe/")

  if (isDetailPage) return null

  return (
    <>
      {/* Mobile bottom bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-sm border-t border-border lg:hidden"
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="flex items-center justify-around h-16 px-6 max-w-lg mx-auto">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className={`flex flex-col items-center gap-1 px-4 py-1 rounded-lg transition-colors duration-150 ${
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[11px] font-medium">{label}</span>
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Desktop sidebar */}
      <aside
        className="hidden lg:flex fixed left-0 top-0 bottom-0 z-40 w-56 flex-col bg-card border-r border-border"
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="px-5 py-6">
<h1 className="text-2xl uppercase tracking-wider">
  <span className="font-black text-orange-500">Recipe</span>
  <span className="font-light text-orange-300">book</span>
</h1>
        </div>
        <div className="flex flex-col gap-1 px-3 flex-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 ${
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                }`}
              >
                <Icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 2} />
                {label}
              </Link>
            )
          })}
        </div>
      </aside>
    </>
  )
}
