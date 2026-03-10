"use client"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface UnsavedChangesDialogProps {
  open: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function UnsavedChangesDialog({
  open,
  onConfirm,
  onCancel,
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
<AlertDialogFooter className="flex-row justify-center items-center sm:justify-center">
          <AlertDialogCancel onClick={onCancel} >
            Keep editing
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm} 
            className="p-1.5 rounded-md text-muted-foreground/40 text-destructive bg-destructive/10 hover:bg-destructive/20 transition-colors duration-150">
            Discard changes
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}