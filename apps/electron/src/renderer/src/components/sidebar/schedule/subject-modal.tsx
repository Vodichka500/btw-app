import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Trash2 } from 'lucide-react'

interface SubjectModalProps {
  open: boolean
  initialName: string
  onClose: () => void
  onSave: (name: string) => void
  onDelete?: () => void
}

export function SubjectModal({ open, initialName, onClose, onSave, onDelete }: SubjectModalProps) {
  const [name, setName] = useState(initialName)

  // Обновляем инпут каждый раз, когда модалка открывается
  useEffect(() => {
    if (open) {
      setName(initialName)
    }
  }, [open, initialName])

  const handleSave = () => {
    const trimmed = name.trim()
    if (trimmed) {
      onSave(trimmed)
    }
  }

  // Если нам передали функцию onDelete, значит мы открыли модалку для существующего предмета
  const isEditing = !!onDelete

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-106 text-foreground">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Редактировать предмет' : 'Новый предмет'}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="subject-name">Название предмета</Label>
            <Input
              id="subject-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Например: Английский язык"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave()
              }}
            />
          </div>
        </div>

        {/* Футер: если редактируем, кнопка удаления слева, кнопки сохранения справа */}
        <DialogFooter className="flex w-full items-center justify-between sm:justify-between">
          {isEditing ? (
            <Button
              variant="destructive"
              size="icon"
              onClick={() => {
                onDelete()
                onClose() // Закрываем после удаления
              }}
              title="Удалить предмет"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          ) : (
            <div /> /* Пустой div, чтобы flex-between правильно отработал */
          )}

          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Отмена
            </Button>
            <Button onClick={handleSave} disabled={!name.trim()}>
              Сохранить
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
