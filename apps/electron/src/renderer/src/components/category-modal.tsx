'use client'

import React, { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'

// 🔥 Берем наш выведенный tRPC тип
import type { CategoryNode } from '@/hooks/use-categories'

interface CategoryModalProps {
  open: boolean
  onClose: () => void
  onSave: (name: string, parentId: number | null) => Promise<void>
  editCategory?: CategoryNode | null
  parentId?: number | null
  flatCategories: CategoryNode[]
}

export function CategoryModal({
  open,
  onClose,
  onSave,
  editCategory,
  parentId,
  flatCategories
}: CategoryModalProps): React.ReactNode {
  const [name, setName] = useState('')
  const [selectedParentId, setSelectedParentId] = useState<string>('none')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      if (editCategory) {
        setName(editCategory.name)
        // Если у категории нет parentId, ставим 'none'
        setSelectedParentId(editCategory.parentId ? String(editCategory.parentId) : 'none')
      } else {
        setName('')
        setSelectedParentId(parentId ? String(parentId) : 'none')
      }
    }
  }, [open, editCategory, parentId])

  const handleSave = async (): Promise<void> => {
    if (!name.trim()) return
    setSaving(true)
    try {
      await onSave(name.trim(), selectedParentId === 'none' ? null : Number(selectedParentId))
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md rounded-2xl text-foreground">
        <DialogHeader>
          <DialogTitle>{editCategory ? 'Edytuj kategorię' : 'Nowa kategoria'}</DialogTitle>
          <DialogDescription>
            {editCategory
              ? 'Zaktualizuj nazwę kategorii.'
              : 'Utwórz nową kategorię, aby uporządkować swoje snippety.'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-row py-2 gap-4">
          <div className="flex flex-col gap-1 flex-1">
            <Label htmlFor="cat-name">Nazwa</Label>
            <Input
              id="cat-name"
              type="text"
              placeholder="np. Wiadomości sprzedażowe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              className="rounded-xl"
            />
          </div>

          {!editCategory && (
            <div className="flex flex-col gap-1 flex-1">
              <Label>Kategoria nadrzędna</Label>
              <Select value={selectedParentId} onValueChange={setSelectedParentId}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Brak (Główny poziom)" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="none">Brak (Główny poziom)</SelectItem>
                  {flatCategories.map((cat) => (
                    <SelectItem key={cat.id} value={String(cat.id)}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving} className="rounded-xl">
            Anuluj
          </Button>
          <Button
            onClick={handleSave}
            disabled={!name.trim() || saving}
            className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {editCategory ? 'Aktualizuj' : 'Utwórz'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
