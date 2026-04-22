import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/shared/ui/dialog'
import { Button } from '@/components/shared/ui/button'
import { Input } from '@/components/shared/ui/input'
import { Label } from '@/components/shared/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/shared/ui/select'
import { CriterionInput, CriterionTypeSchema, CriterionType } from '@btw-app/shared'

const CriterionTypeEnum = CriterionTypeSchema.enum

interface CriterionModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: CriterionInput) => void
  initialData: CriterionInput | null
}

export function CriterionModal({ isOpen, onClose, onSave, initialData }: CriterionModalProps) {
  // Local State
  const [name, setName] = useState(initialData?.name || '')
  const [tag, setTag] = useState(initialData?.tag || '')
  const [type, setType] = useState<CriterionType>(initialData?.type || CriterionTypeEnum.TEXT)

  // Handlers & Callbacks
  const handleSave = () => {
    if (!name.trim() || !tag.trim()) return

    onSave({
      id: initialData?.id || 0, // 0 говорит бэкенду, что нужно создать новую запись
      name,
      tag,
      type
    })
  }

  // Main Return
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="rounded-2xl">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Edytuj kryterium' : 'Dodaj nowe kryterium'}</DialogTitle>
          <DialogDescription>
            Zdefiniuj kryterium oceny, które będzie dostępne w szablonie raportu.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="criterionName">Nazwa kryterium</Label>
            <Input
              id="criterionName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="np. Zadanie Domowe"
              className="rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="criterionTag">Zmienna (np. {'{KAMERA}'})</Label>
            <Input
              id="criterionTag"
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              placeholder="np. {ZADANIE_DOMOWE}"
              className="rounded-xl font-mono"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="criterionType">Typ odpowiedzi</Label>
            <Select value={type} onValueChange={(v) => setType(v as CriterionType)}>
              <SelectTrigger id="criterionType" className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={CriterionTypeEnum.YES_NO}>Opcje Tak/Nie</SelectItem>
                <SelectItem value={CriterionTypeEnum.SCALE}>Skala 1-5</SelectItem>
                <SelectItem value={CriterionTypeEnum.TEXT}>Tekst</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="rounded-xl">
            Anuluj
          </Button>
          <Button onClick={handleSave} className="rounded-xl">
            Zapisz
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
