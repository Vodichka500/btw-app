'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Trash2, FolderOpen } from 'lucide-react'

interface DeleteCategoryModalProps {
  open: boolean
  onClose: () => void
  onConfirm: (deleteAll: boolean) => void
  categoryName: string
}

export function DeleteCategoryModal({
  open,
  onClose,
  onConfirm,
  categoryName
}: DeleteCategoryModalProps) {
  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="sm:max-w-[440px] rounded-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-full bg-destructive/10 text-destructive">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <DialogTitle>Usuwanie kategorii</DialogTitle>
          </div>
          <DialogDescription className="text-base">
            Co chcesz сделать с zawartością kategorii <strong>{categoryName}</strong>?
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <button
            onClick={() => onConfirm(false)}
            className="flex items-start gap-4 p-4 rounded-xl border border-border hover:bg-sidebar-accent transition-all text-left group"
          >
            <FolderOpen className="h-5 w-5 mt-1 text-muted-foreground group-hover:text-primary" />
            <div>
              <p className="font-semibold text-sm">Tylko kategoria</p>
              <p className="text-xs text-muted-foreground mt-1">
                Snippety zostaną zachowane и będą dostępne we &#34;Wszystkie Snippety&#34;.
              </p>
            </div>
          </button>

          <button
            onClick={() => onConfirm(true)}
            className="flex items-start gap-4 p-4 rounded-xl border border-border hover:border-destructive/50 hover:bg-destructive/5 transition-all text-left group"
          >
            <Trash2 className="h-5 w-5 mt-1 text-muted-foreground group-hover:text-destructive" />
            <div>
              <p className="font-semibold text-sm text-destructive">
                Kategoria i wszystko w środku
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Kategoria oraz wszystkie znajdujące się w niej snippety trafią do kosza.
              </p>
            </div>
          </button>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} className="rounded-xl">
            Anuluj
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
