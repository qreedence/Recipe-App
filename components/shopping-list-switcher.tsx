'use client'

import { useState, useEffect } from 'react'
import { ChevronDown, Plus, Pencil, Trash2, Check } from 'lucide-react'
import { toast } from 'sonner'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Dialog,
  DialogContent,
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
import type { ShoppingList } from '@/lib/types'

export function ShoppingListSwitcher() {
  const { lists } = useShoppingLists()
  const { activeListId, activeList } = useActiveList()
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

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button className="flex items-center gap-1.5 -mx-2 px-2 py-1 rounded-lg hover:bg-accent transition-colors max-w-full">
            <span className="text-xl font-bold text-foreground truncate">
              {activeList.name}
            </span>
            <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-64 p-1">
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
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  lists: ShoppingList[]
  activeListId: string | null
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Manage lists</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-0.5">
          {lists.map((list) => (
            <ManageListRow
              key={list.id}
              list={list}
              canDelete={lists.length > 1}
              isActive={list.id === activeListId}
            />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function ManageListRow({
  list,
  canDelete,
  isActive,
}: {
  list: ShoppingList
  canDelete: boolean
  isActive: boolean
}) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(list.name)
  const [confirmDelete, setConfirmDelete] = useState(false)
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
    </div>
  )
}
