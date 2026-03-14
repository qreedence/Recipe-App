'use client'

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

interface UnsavedChangesDialogProps {
  open: boolean
  onConfirm: () => void
  onCancel: () => void
  onSaveDraft?: () => void
}

export function UnsavedChangesDialog({
  open,
  onConfirm,
  onCancel,
  onSaveDraft,
}: UnsavedChangesDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={(v) => !v && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader className="text-center sm:text-center">
          <AlertDialogTitle>You have unsaved changes</AlertDialogTitle>
          <AlertDialogDescription>
            If you leave now, your progress will be lost. Are you sure?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
          <AlertDialogCancel onClick={onCancel} className="w-full">
            Keep editing
          </AlertDialogCancel>
          {onSaveDraft && (
            <AlertDialogAction
              onClick={onSaveDraft}
              className="w-full px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors duration-150"
            >
              Save draft & leave
            </AlertDialogAction>
          )}
          <AlertDialogAction
            onClick={onConfirm}
            className="w-full px-4 py-2 rounded-md text-destructive bg-destructive/10 hover:bg-destructive/20 transition-colors duration-150"
          >
            Discard changes
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
