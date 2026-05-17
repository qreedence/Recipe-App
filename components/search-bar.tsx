"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
}

interface UserResult {
  userId: string
  username: string
  avatarUrl: string | null
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  const router = useRouter()
  const [focused, setFocused] = useState(false)
  const [userResults, setUserResults] = useState<UserResult[]>([])
  const [searching, setSearching] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null)

  const query = value.trim()
  const showPopover = focused && query.length >= 2 && userResults.length > 0

  useEffect(() => {
    if (query.length < 2) {
      setUserResults([])
      return
    }

    if (debounceRef.current) clearTimeout(debounceRef.current)

    debounceRef.current = setTimeout(async () => {
      setSearching(true)
      const supabase = createClient()

      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, username, avatar_url')
        .ilike('username', `%${query}%`)
        .eq('is_public', true)
        .limit(5)

      setUserResults(
        (profiles ?? []).map((p) => ({
          userId: p.user_id,
          username: p.username,
          avatarUrl: p.avatar_url,
        })),
      )

      setSearching(false)
    }, 300)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setFocused(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  function navigateTo(href: string) {
    setFocused(false)
    onChange("")
    router.push(href)
  }

  return (
    <div ref={containerRef} className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        type="text"
        placeholder="Search recipes & users..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        className="pl-10 pr-9 h-11 bg-card border-border"
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Clear search"
        >
          <X className="h-4 w-4" />
        </button>
      )}
      {showPopover && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
          <p className="px-3 pt-2.5 pb-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">Users</p>
          {userResults.map((u) => (
            <button
              key={u.userId}
              onClick={() => navigateTo(`/u/${u.username}`)}
              className="w-full flex items-center gap-3 px-3 py-2 hover:bg-accent transition-colors"
            >
              {u.avatarUrl ? (
                <img src={u.avatarUrl} alt={u.username} className="w-8 h-8 rounded-full object-cover shrink-0" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                  {u.username[0].toUpperCase()}
                </div>
              )}
              <span className="text-sm font-medium text-foreground">{u.username}</span>
            </button>
          ))}
          {searching && userResults.length === 0 && (
            <p className="px-3 py-4 text-sm text-muted-foreground text-center">Searching...</p>
          )}
        </div>
      )}
    </div>
  )
}
