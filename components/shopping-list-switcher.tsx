'use client'

import { useState, useEffect } from 'react'
import { ChevronDown, Plus, Pencil, Trash2, Check, Users, Mail } from 'lucide-react'
import { toast } from 'sonner'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
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
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  useShoppingLists,
  useActiveList,
  setActiveListAndRevalidate,
  createListAndRevalidate,
  renameListAndRevalidate,
  deleteListAndRevalidate,
} from '@/hooks/use-shopping-lists'
import {
  useIncomingInvites,
  acceptInviteAndRevalidate,
  declineInviteAndRevalidate,
} from '@/hooks/use-shopping-list-sharing'
import { useUser } from '@/hooks/use-user'
import { ShoppingListShareDialog } from '@/components/shopping-list-share-dialog'
import type { ShoppingList } from '@/lib/types'

export function ShoppingListSwitcher() {
  const { user } = useUser()
  const { lists } = useShoppingLists()
  const { activeListId, activeList } = useActiveList()
  const { invites } = useIncomingInvites()
  const [open, setOpen] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [showManage, setShowManage] = useState(false)

  if (!activeList) {
    return <h1 className="text-xl font-bold text-foreground">Shopping List</h1>
  }

  async function handleSwitch(listId: string) {
    setOpen(false)
    if (listId === activeListId) return
    const ok = await setActiveListAndRevalidate(listId)
    if (!ok) toast.error('Failed to switch list')
  }

  async function handleAccept(inviteId: string, listId: string) {
    const ok = await acceptInviteAndRevalidate(inviteId, listId)
    if (ok) {
      // Switch the user to the newly-joined list so they can see the items.
      await setActiveListAndRevalidate(listId)
    } else {
      toast.error('Failed to accept invite')
    }
  }

  async function handleDecline(inviteId: string) {
    const ok = await declineInviteAndRevalidate(inviteId)
    if (!ok) toast.error('Failed to decline invite')
  }

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button className="flex items-center gap-1.5 -mx-2 px-2 py-1 rounded-lg hover:bg-accent transition-colors max-w-full">
            <span className="text-xl font-bold text-foreground truncate">
              {activeList.name}
            </span>
            <div className="relative shrink-0">
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
              {invites.length > 0 && (
                <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-primary" />
              )}
            </div>
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-72 p-1">
          <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Your lists
          </div>
          {lists.map((list) => (
            <button
              key={list.id}
              onClick={() => handleSwitch(list.id)}
              className="w-full flex items-center justify-between px-2 py-2 text-sm rounded-md hover:bg-accent text-left"
            >
              <span className="truncate">{list.name}</span>
              {list.id === activeListId && (
                <Check className="h-4 w-4 text-primary shrink-0 ml-2" />
              )}
            </button>
          ))}

          {invites.length > 0 && (
            <>
              <div className="border-t border-border my-1" />
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Mail className="h-3 w-3" />
                Invites &middot; {invites.length}
              </div>
              {invites.map((inv) => (
                <div
                  key={inv.id}
                  className="px-2 py-1.5 rounded-md flex flex-col gap-1"
                >
                  <p className="text-sm leading-tight">
                    <span className="font-medium">@{inv.inviterUsername}</span>
                    <span className="text-muted-foreground"> invited you to </span>
                    <span className="font-medium">{inv.listName}</span>
                  </p>
                  <div className="flex gap-1.5 mt-0.5">
                    <Button
                      variant="default"
                      size="sm"
                      className="h-7 text-xs flex-1"
                      onClick={() => handleAccept(inv.id, inv.listId)}
                    >
                      Accept
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs flex-1"
                      onClick={() => handleDecline(inv.id)}
                    >
                      Decline
                    </Button>
                  </div>
                </div>
              ))}
            </>
          )}

          <div className="border-t border-border my-1" />
          <button
            onClick={() => {
              setOpen(false)
              setShowCreate(true)
            }}
            className="w-full flex items-center gap-2 px-2 py-2 text-sm rounded-md hover:bg-accent text-left"
          >
            <Plus className="h-4 w-4 text-muted-foreground" />
            New list
          </button>
          <button
            onClick={() => {
              setOpen(false)
              setShowManage(true)
            }}
            className="w-full flex items-center gap-2 px-2 py-2 text-sm rounded-md hover:bg-accent text-left"
          >
            <Pencil className="h-4 w-4 text-muted-foreground" />
            Manage lists
          </button>
        </PopoverContent>
      </Popover>

      <CreateListDialog open={showCreate} onOpenChange={setShowCreate} />
      <ManageListsDialog
        open={showManage}
        onOpenChange={setShowManage}
        lists={lists}
        activeListId={activeListId}
        currentUserId={user?.id ?? null}
      />
    </>
  )
}

function CreateListDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [name, setName] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open) setName('')
  }, [open])

  async function handleCreate() {
    const trimmed = name.trim()
    if (!trimmed) return
    setSubmitting(true)
    const created = await createListAndRevalidate(trimmed)
    setSubmitting(false)
    if (!created) {
      toast.error('Failed to create list')
      return
    }
    onOpenChange(false)
    await setActiveListAndRevalidate(created.id)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New shopping list</DialogTitle>
          <DialogDescription>
            Give it a name — you can rename or delete it later.
          </DialogDescription>
        </DialogHeader>
        <Input
          autoFocus
          placeholder="List name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleCreate()
          }}
          maxLength={80}
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={!name.trim() || submitting}>
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ManageListsDialog({
  open,
  onOpenChange,
  lists,
  activeListId,
  currentUserId,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  lists: ShoppingList[]
  activeListId: string | null
  currentUserId: string | null
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Manage lists</DialogTitle>
          <DialogDescription>
            Rename or delete your lists. Share lists with mutuals to edit them together.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-0.5">
          {lists.map((list) => {
            const isCreator = !!(currentUserId && list.createdBy === currentUserId)
            const ownedCount = currentUserId
              ? lists.filter((l) => l.createdBy === currentUserId).length
              : 0
            return (
              <ManageListRow
                key={list.id}
                list={list}
                isCreator={isCreator}
                canDelete={isCreator && ownedCount > 1}
                isActive={list.id === activeListId}
                currentUserId={currentUserId}
              />
            )
          })}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function ManageListRow({
  list,
  isCreator,
  canDelete,
  isActive,
  currentUserId,
}: {
  list: ShoppingList
  isCreator: boolean
  canDelete: boolean
  isActive: boolean
  currentUserId: string | null
}) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(list.name)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [showShare, setShowShare] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!editing) setName(list.name)
  }, [editing, list.name])

  async function saveRename() {
    const trimmed = name.trim()
    if (!trimmed || trimmed === list.name) {
      setEditing(false)
      setName(list.name)
      return
    }
    setSaving(true)
    const ok = await renameListAndRevalidate(list.id, trimmed)
    setSaving(false)
    if (ok) {
      setEditing(false)
    } else {
      toast.error('Failed to rename list')
      setName(list.name)
    }
  }

  async function handleDelete() {
    const ok = await deleteListAndRevalidate(list.id)
    if (!ok) toast.error('Failed to delete list')
    setConfirmDelete(false)
  }

  return (
    <div className="flex items-center gap-1 px-2 py-1.5 rounded-md hover:bg-accent">
      {editing ? (
        <Input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') saveRename()
            if (e.key === 'Escape') {
              setName(list.name)
              setEditing(false)
            }
          }}
          onBlur={saveRename}
          maxLength={80}
          disabled={saving}
          className="h-8 flex-1"
        />
      ) : (
        <>
          <span className="flex-1 text-sm truncate">{list.name}</span>
          {isActive && (
            <span className="text-xs text-muted-foreground mr-1">Active</span>
          )}
          {!isCreator && (
            <span className="text-xs text-muted-foreground mr-1">Shared</span>
          )}
          <button
            onClick={() => setShowShare(true)}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            aria-label={isCreator ? 'Share list' : 'View members'}
          >
            <Users className="h-4 w-4" />
          </button>
          {isCreator && (
            <>
              <button
                onClick={() => setEditing(true)}
                className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                aria-label="Rename list"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                onClick={() => setConfirmDelete(true)}
                disabled={!canDelete}
                className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-muted-foreground"
                aria-label="Delete list"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </>
          )}
        </>
      )}
      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete &ldquo;{list.name}&rdquo;?</AlertDialogTitle>
            <AlertDialogDescription>
              All items in this list will also be removed. This can&rsquo;t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <ShoppingListShareDialog
        open={showShare}
        onOpenChange={setShowShare}
        list={list}
        currentUserId={currentUserId}
      />
    </div>
  )
}
