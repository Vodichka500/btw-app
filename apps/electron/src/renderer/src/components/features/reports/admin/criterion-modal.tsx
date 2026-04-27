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
import { CriterionInput } from '@btw-app/shared'
import { Plus, Trash2 } from 'lucide-react'

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

  // 🔥 Новый стейт для массива опций. По умолчанию даем 2 пустых поля
  const [options, setOptions] = useState<string[]>(
    initialData?.options && initialData.options.length > 0 ? initialData.options : ['', '']
  )

  // Обработчики для опций
  const handleAddOption = () => {
    setOptions([...options, ''])
  }

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options]
    newOptions[index] = value
    setOptions(newOptions)
  }

  const handleRemoveOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index))
  }

  // Handlers & Callbacks
  const handleSave = () => {
    // 🔥 Очищаем пустые строки из массива перед сохранением
    const validOptions = options.map((opt) => opt.trim()).filter(Boolean)

    // Проверяем, чтобы всё было заполнено
    if (!name.trim() || !tag.trim() || validOptions.length === 0) return

    onSave({
      id: initialData?.id || 0, // 0 говорит бэкенду, что нужно создать новую запись
      name: name.trim(),
      tag: tag.trim(),
      options: validOptions // 🔥 Передаем массив вместо type
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="rounded-2xl max-w-md bg-card border-border/50">
        <DialogHeader>
          <DialogTitle className="text-foreground tracking-tight">
            {initialData ? 'Edytuj kryterium' : 'Dodaj nowe kryterium'}
          </DialogTitle>
          <DialogDescription className="font-medium">
            Zdefiniuj kryterium oceny oraz możliwe warianty odpowiedzi.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4 max-h-[60vh] overflow-y-auto custom-scrollbar pr-3">
          <div className="space-y-2">
            <Label htmlFor="criterionName" className="font-semibold text-foreground">
              Nazwa kryterium
            </Label>
            <Input
              id="criterionName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="np. Zadanie Domowe"
              className="rounded-xl bg-secondary/50 border-none focus-visible:ring-2 focus-visible:ring-primary/50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="criterionTag" className="font-semibold text-foreground">
              Zmienna (np. {'{KAMERA}'})
            </Label>
            <Input
              id="criterionTag"
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              placeholder="np. {ZADANIE_DOMOWE}"
              className="rounded-xl font-mono bg-secondary/50 border-none focus-visible:ring-2 focus-visible:ring-primary/50"
            />
          </div>

          {/* 🔥 Блок динамических опций */}
          <div className="space-y-3 pt-2">
            <Label className="font-semibold text-foreground">Opcje odpowiedzi</Label>
            <div className="space-y-2">
              {options.map((opt, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Input
                    value={opt}
                    onChange={(e) => handleOptionChange(idx, e.target.value)}
                    placeholder={`Opcja ${idx + 1}`}
                    className="rounded-xl bg-secondary/50 border-none flex-1 focus-visible:ring-2 focus-visible:ring-primary/50"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 h-10 w-10 text-muted-foreground hover:text-accent hover:bg-accent/10 rounded-xl transition-colors"
                    onClick={() => handleRemoveOption(idx)}
                    disabled={options.length <= 1} // Не даем удалить последнюю опцию
                    title="Usuń opcję"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleAddOption}
              className="w-full rounded-xl border-dashed h-10 text-muted-foreground hover:text-foreground"
            >
              <Plus className="h-4 w-4 mr-2" /> Dodaj kolejną opcję
            </Button>
          </div>
        </div>

        <DialogFooter className="pt-4 border-t border-border/50 mt-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="rounded-xl w-full sm:w-auto"
          >
            Anuluj
          </Button>
          <Button
            onClick={handleSave}
            className="rounded-xl w-full sm:w-auto"
            disabled={!name.trim() || !tag.trim() || options.filter((o) => o.trim()).length === 0}
          >
            Zapisz
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
