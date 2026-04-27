import { useState } from 'react'
import { Loader2, Wand2 } from 'lucide-react'
import { toast } from 'sonner'
import { trpc } from '@/lib/trpc'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/shared/ui/dialog'
import { Button } from '@/components/shared/ui/button'
import { Label } from '@/components/shared/ui/label'
import { Input } from '@/components/shared/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/shared/ui/select'
import { LessonType } from '@btw-app/shared'

interface GenerateCycleModalProps {
  isOpen: boolean
  onClose: () => void
}

export function GenerateCycleModal({ isOpen, onClose }: GenerateCycleModalProps) {
  const trpcUtils = trpc.useUtils()

  // Инициализируем даты один раз при маунте
  const [periodStart, setPeriodStart] = useState(() => {
    const d = new Date()
    d.setDate(1) // 1-е число текущего месяца
    return d.toISOString().split('T')[0]
  })
  const [periodEnd, setPeriodEnd] = useState(() => new Date().toISOString().split('T')[0])
  const [lessonType, setLessonType] = useState<LessonType>('ALL')
  const [label, setLabel] = useState('')

  const generateMut = trpc.reports.generateCycle.useMutation({
    onSuccess: (data) => {
      toast.dismiss('gen-toast')
      toast.success(`Sukces! Wygenerowano raportów: ${data.reportsGenerated}`)

      if (data.warnings.missingCustomerAlfaIds.length > 0) {
        toast.warning(
          `Pominięto ${data.warnings.missingCustomerAlfaIds.length} uczniów (brak w bazie).`
        )
      }

      trpcUtils.reports.getAdminCycles.invalidate()
      onClose()
    },
    onError: (e) => {
      toast.dismiss('gen-toast')
      toast.error(`Błąd generowania: ${e.message}`)
    }
  })

  const handleGenerate = async () => {
    try {
      toast.loading('Pobieranie tokenu AlfaCRM...', { id: 'gen-toast' })
      const tokenRes = await trpcUtils.alfa.getTempToken.fetch()

      toast.loading('Generowanie cyklu... To może chwilę potrwać.', { id: 'gen-toast' })

      generateMut.mutate({
        alfaTempToken: tokenRes.token,
        periodStart,
        periodEnd,
        lessonType,
        label: label.trim() ? label.trim() : undefined
      })
    } catch (error: any) {
      toast.dismiss('gen-toast')
      toast.error(`Błąd: ${error.message}`)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] rounded-2xl bg-card border-border/50">
        <DialogHeader>
          <DialogTitle className="text-foreground tracking-tight">
            Generowanie nowego cyklu
          </DialogTitle>
          <DialogDescription className="font-medium">
            Wybierz okres i typ lekcji, aby utworzyć nowe raporty dla nauczycieli.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="label" className="font-semibold">
              Nazwa cyklu (opcjonalnie)
            </Label>
            <Input
              id="label"
              placeholder="Np. Indywidualne Listopad"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="rounded-xl bg-secondary/50 border-none focus-visible:ring-2 focus-visible:ring-primary/50"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start" className="font-semibold">
                Data początkowa
              </Label>
              <Input
                id="start"
                type="date"
                value={periodStart}
                onChange={(e) => setPeriodStart(e.target.value)}
                className="rounded-xl bg-secondary/50 border-none focus-visible:ring-2 focus-visible:ring-primary/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end" className="font-semibold">
                Data końcowa
              </Label>
              <Input
                id="end"
                type="date"
                value={periodEnd}
                onChange={(e) => setPeriodEnd(e.target.value)}
                className="rounded-xl bg-secondary/50 border-none focus-visible:ring-2 focus-visible:ring-primary/50"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="font-semibold">Typ lekcji do uwzględnienia</Label>
            <Select value={lessonType} onValueChange={(val: LessonType) => setLessonType(val)}>
              <SelectTrigger className="rounded-xl bg-secondary/50 border-none focus:ring-2 focus:ring-primary/50">
                <SelectValue placeholder="Wybierz typ" />
              </SelectTrigger>
              <SelectContent className="rounded-xl bg-card border-border/50 shadow-lg">
                <SelectItem value="ALL">Wszystkie lekcje</SelectItem>
                <SelectItem value="INDIVIDUAL">Tylko indywidualne</SelectItem>
                <SelectItem value="GROUP">Tylko grupowe</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            className="rounded-xl"
            disabled={generateMut.isLoading}
          >
            Anuluj
          </Button>
          <Button onClick={handleGenerate} disabled={generateMut.isLoading} className="rounded-xl">
            {generateMut.isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Wand2 className="mr-2 h-4 w-4" />
            )}
            Generuj cykl
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
