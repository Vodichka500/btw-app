import { useEffect, useState } from 'react'
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
  const [name, setName] = useState('')
  const [tag, setTag] = useState('')
  const [type, setType] = useState<'SELECT' | 'TEXT'>('SELECT')
  const [required, setRequired] = useState(true)
  const [options, setOptions] = useState<string[]>(['', ''])

  useEffect(() => {
    if (!isOpen) return

    setName(initialData?.name || '')
    setTag(initialData?.tag || '')
    setType(initialData?.type || 'SELECT')
    setRequired(initialData?.required ?? true)
    setOptions(initialData?.options?.length ? initialData.options : ['', ''])
  }, [initialData, isOpen])

  const handleAddOption = () => setOptions((current) => [...current, ''])

  const handleOptionChange = (index: number, value: string) => {
    setOptions((current) => current.map((option, i) => (i === index ? value : option)))
  }

  const handleRemoveOption = (index: number) => {
    setOptions((current) => current.filter((_, i) => i !== index))
  }

  const validOptions = options.map((option) => option.trim()).filter(Boolean)
  const canSave =
    Boolean(name.trim()) && Boolean(tag.trim()) && (type === 'TEXT' || validOptions.length > 0)

  const handleSave = () => {
    if (!canSave) return

    onSave({
      id: initialData?.id || 0,
      name: name.trim(),
      tag: tag.trim(),
      type,
      required,
      options: type === 'SELECT' ? validOptions : []
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
            Ustaw typ odpowiedzi i wymagane pola kryterium.
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

          <div className="space-y-2">
            <Label htmlFor="criterionType" className="font-semibold text-foreground">
              Typ pola
            </Label>
            <select
              id="criterionType"
              value={type}
              onChange={(e) => setType(e.target.value as 'SELECT' | 'TEXT')}
              className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="SELECT">Wybór z listy</option>
              <option value="TEXT">Tekst wpisywany ręcznie</option>
            </select>
          </div>

          <label className="flex items-center gap-3 rounded-xl border border-border/60 bg-secondary/30 p-3 cursor-pointer">
            <input
              type="checkbox"
              checked={required}
              onChange={(e) => setRequired(e.target.checked)}
              className="h-4 w-4 accent-primary"
            />
            <span className="text-sm font-semibold text-foreground">Pole obowiązkowe</span>
          </label>

          {type === 'SELECT' && (
            <div className="space-y-3 pt-2">
              <Label className="font-semibold text-foreground">Opcje odpowiedzi</Label>
              <div className="space-y-2">
                {options.map((option, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      value={option}
                      onChange={(e) => handleOptionChange(index, e.target.value)}
                      placeholder={`Opcja ${index + 1}`}
                      className="rounded-xl bg-secondary/50 border-none flex-1 focus-visible:ring-2 focus-visible:ring-primary/50"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0 h-10 w-10 text-muted-foreground hover:text-accent hover:bg-accent/10 rounded-xl transition-colors"
                      onClick={() => handleRemoveOption(index)}
                      disabled={options.length <= 1}
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
          )}
        </div>

        <DialogFooter className="pt-4 border-t border-border/50 mt-2">
          <Button variant="outline" onClick={onClose} className="rounded-xl w-full sm:w-auto">
            Anuluj
          </Button>
          <Button onClick={handleSave} className="rounded-xl w-full sm:w-auto" disabled={!canSave}>
            Zapisz
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
