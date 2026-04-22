import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/shared/ui/dialog'
import { Input } from '@/components/shared/ui/input'
import { Button } from '@/components/shared/ui/button'
import { Label } from '@/components/shared/ui/label'
import { Trash2, Loader2 } from 'lucide-react'

interface SubjectModalProps {
  open: boolean
  initialName: string
  onClose: () => void
  // Разрешаем функциям возвращать Promise, чтобы модалка могла ждать
  onSave: (name: string) => Promise<void> | void
  onDelete?: () => Promise<void> | void
}

export function SubjectModal({ open, initialName, onClose, onSave, onDelete }: SubjectModalProps) {
  const [name, setName] = useState(initialName)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Обновляем инпут каждый раз, когда модалка открывается
  useEffect(() => {
    if (open) {
      setName(initialName)
      setIsSubmitting(false) // Сбрасываем статус при открытии
    }
  }, [open, initialName])

  const handleSave = async () => {
    const trimmed = name.trim()
    if (trimmed) {
      setIsSubmitting(true)
      try {
        await onSave(trimmed)
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  const handleDelete = async () => {
    if (onDelete) {
      setIsSubmitting(true)
      try {
        await onDelete()
        onClose() // Закрываем только если удаление прошло успешно
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  const isEditing = !!onDelete

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && !isSubmitting && onClose()}>
      <DialogContent className="sm:max-w-106 text-foreground">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edytuj przedmiot' : 'Nowy przedmiot'}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="subject-name">Nazwa przedmiotu</Label>
            <Input
              id="subject-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Np.: Język angielski"
              autoFocus
              disabled={isSubmitting}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave()
              }}
            />
          </div>
        </div>

        <DialogFooter className="flex w-full items-center justify-between sm:justify-between">
          {isEditing ? (
            <Button
              variant="destructive"
              size="icon"
              onClick={handleDelete}
              disabled={isSubmitting}
              title="Usuń przedmiot"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </Button>
          ) : (
            <div />
          )}

          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
              Anuluj
            </Button>
            <Button onClick={handleSave} disabled={!name.trim() || isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Zapisz
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
