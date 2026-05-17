'use client'

import { useState, useMemo } from 'react'
import { Search, UserPlus, X, LogOut, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  useListMembers,
  useOutgoingInvitesForList,
  useMutualFollows,
  sendInviteAndRevalidate,
  rescindInviteAndRevalidate,
  removeMemberAndRevalidate,
  leaveListAndRevalidate,
} from '@/hooks/use-shopping-list-sharing'
import type { ShoppingList } from '@/lib/types'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  list: ShoppingList | null
  currentUserId: string | null
}

export function ShoppingListShareDialog({ open, onOpenChange, list, currentUserId }: Props) {
  const isCreator = !!(list && currentUserId && list.createdBy === currentUserId)
  const { members } = useListMembers(list?.id ?? null)
  const { invites: outgoingInvites } = useOutgoingInvitesForList(
    isCreator ? list?.id ?? null : null,
  )
  const { mutuals, isLoading: mutualsLoading } = useMutualFollows()
  const [search, setSearch] = useState('')
  const [confirmLeave, setConfirmLeave] = useState(false)

  const memberIds = useMemo(() => new Set(members.map((m) => m.userId)), [members])
  const pendingByUserId = useMemo(() => {
    const map = new Map<string, string>()
    for (const inv of outgoingInvites) map.set(inv.inviteeId, inv.id)
    return map
  }, [outgoingInvites])

  const filteredMutuals = useMemo(() => {
    const q = search.trim().toLowerCase()
    return mutuals
      .filter((m) => !memberIds.has(m.userId))
      .filter((m) => (q ? m.username.toLowerCase().includes(q) : true))
  }, [mutuals, memberIds, search])

  if (!list) return null

  async function handleInvite(userId: string) {
    if (!list) return
    const ok = await sendInviteAndRevalidate(list.id, userId)
    if (!ok) toast.error('Failed to send invite')
  }

  async function handleRescind(inviteId: string) {
    if (!list) return
    const ok = await rescindInviteAndRevalidate(inviteId, list.id)
    if (!ok) toast.error('Failed to rescind invite')
  }

  async function handleRemove(userId: string) {
    if (!list) return
    const ok = await removeMemberAndRevalidate(list.id, userId)
    if (!ok) toast.error('Failed to remove member')
  }

  async function handleLeave() {
    if (!list) return
    const ok = await leaveListAndRevalidate(list.id)
    setConfirmLeave(false)
    if (ok) {
      onOpenChange(false)
    } else {
      toast.error('Failed to leave list')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share &ldquo;{list.name}&rdquo;</DialogTitle>
          <DialogDescription>
            {isCreator
              ? 'Invite mutuals to view and edit this list.'
              : "You're a member of this shared list."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 max-h-[60vh] overflow-y-auto -mx-1 px-1">
          {/* Members */}
          <section>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Members &middot; {members.length}
            </h3>
            <div className="flex flex-col gap-0.5">
              {members.map((m) => {
                const isOwner = m.userId === list.createdBy
                const isYou = m.userId === currentUserId
                return (
                  <div
                    key={m.userId}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-md"
                  >
                    <Avatar className="h-7 w-7">
                      <AvatarImage src={m.avatarUrl ?? undefined} alt={m.username} />
                      <AvatarFallback className="text-xs">
                        {m.username.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="flex-1 text-sm truncate">
                      @{m.username}
                      {isYou && <span className="text-muted-foreground"> (you)</span>}
                    </span>
                    {isOwner ? (
                      <span className="text-xs text-muted-foreground">Owner</span>
                    ) : isCreator ? (
                      <button
                        onClick={() => handleRemove(m.userId)}
                        className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        aria-label={`Remove ${m.username}`}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    ) : null}
                  </div>
                )
              })}
            </div>
          </section>

          {/* Pending invites (creator only) */}
          {isCreator && outgoingInvites.length > 0 && (
            <section>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Pending &middot; {outgoingInvites.length}
              </h3>
              <div className="flex flex-col gap-0.5">
                {outgoingInvites.map((inv) => (
                  <div
                    key={inv.id}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-md"
                  >
                    <Avatar className="h-7 w-7 opacity-60">
                      <AvatarFallback className="text-xs">
                        {inv.inviteeUsername.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="flex-1 text-sm truncate text-muted-foreground">
                      @{inv.inviteeUsername}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRescind(inv.id)}
                      className="h-7 text-xs"
                    >
                      Rescind
                    </Button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Add people (creator only) */}
          {isCreator && (
            <section>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Invite a mutual
              </h3>
              <div className="relative mb-2">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search mutuals..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 h-9"
                />
              </div>
              {mutualsLoading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              ) : mutuals.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2 px-2">
                  No mutuals yet — you and someone need to follow each other to share lists.
                </p>
              ) : filteredMutuals.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2 px-2">
                  {search.trim()
                    ? 'No matches.'
                    : 'Everyone you mutually follow is already on this list.'}
                </p>
              ) : (
                <div className="flex flex-col gap-0.5">
                  {filteredMutuals.map((m) => {
                    const pendingInviteId = pendingByUserId.get(m.userId)
                    return (
                      <div
                        key={m.userId}
                        className="flex items-center gap-2 px-2 py-1.5 rounded-md"
                      >
                        <Avatar className="h-7 w-7">
                          <AvatarImage src={m.avatarUrl ?? undefined} alt={m.username} />
                          <AvatarFallback className="text-xs">
                            {m.username.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="flex-1 text-sm truncate">@{m.username}</span>
                        {pendingInviteId ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRescind(pendingInviteId)}
                            className="h-7 text-xs"
                          >
                            Pending
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleInvite(m.userId)}
                            className="h-7 text-xs"
                          >
                            <UserPlus className="h-3.5 w-3.5 mr-1" />
                            Invite
                          </Button>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </section>
          )}
        </div>

        {!isCreator && (
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmLeave(true)}
              className="text-destructive hover:text-destructive"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Leave list
            </Button>
          </DialogFooter>
        )}

        <AlertDialog open={confirmLeave} onOpenChange={setConfirmLeave}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Leave &ldquo;{list.name}&rdquo;?</AlertDialogTitle>
              <AlertDialogDescription>
                You won&rsquo;t see this list anymore. The owner can invite you back later.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleLeave}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Leave
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  )
}
