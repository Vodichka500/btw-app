'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/shared/ui/dialog'
import { Button } from '@/components/shared/ui/button'
import { Label } from '@/components/shared/ui/label'
import { Checkbox } from '@/components/shared/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/shared/ui/select'
import { Loader2, AlertCircle, Clock, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import { trpc } from '@/lib/trpc'

export type StudentForSend = {
  alfaId: number
  name: string
  amountCalculated: number
  messageBody: string
  tgChatId: string | null
  isSent?: boolean
  hasTg?: boolean
}

interface SendMessagesModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  selectedStudents: StudentForSend[]
  monthNum: number // 🔥 Добавили месяц
  yearNum: number // 🔥 Добавили год
  onComplete: (sentIds: number[]) => void
}

type Step = 'settings' | 'sending' | 'finished' | 'cancelled'
type SendError = { alfaId: number; name: string; reason: string }

export function SendMessagesModal({
  isOpen,
  onOpenChange,
  selectedStudents,
  monthNum,
  yearNum,
  onComplete
}: SendMessagesModalProps) {
  const [step, setStep] = useState<Step>('settings')
  const [skipSent, setSkipSent] = useState(true)
  const [delayStr, setDelayStr] = useState('2000')
  const [progress, setProgress] = useState(0)
  const [sentIds, setSentIds] = useState<number[]>([])
  const [errors, setErrors] = useState<SendError[]>([])

  // 🔥 Реф для мгновенной отмены асинхронного цикла
  const cancelRef = useRef(false)

  // Мутация tRPC
  const sendMutation = trpc.billing.sendMassBilling.useMutation()

  useEffect(() => {
    if (isOpen) {
      setStep('settings')
      setProgress(0)
      setSentIds([])
      setErrors([])
      cancelRef.current = false
    }
  }, [isOpen])

  const delayMs = parseInt(delayStr, 10)

  const studentsToSend = useMemo(() => {
    if (skipSent) return selectedStudents.filter((s) => !s.isSent)
    return selectedStudents
  }, [selectedStudents, skipSent])

  const totalTimeSec = Math.ceil((studentsToSend.length * delayMs) / 1000)
  const timeLeftSec = Math.ceil(((studentsToSend.length - progress) * delayMs) / 1000)
  const progressPercentage =
    studentsToSend.length > 0 ? Math.round((progress / studentsToSend.length) * 100) : 0

  const formatTime = (sec: number) => {
    if (sec < 60) return `${sec} sek`
    const m = Math.floor(sec / 60)
    const s = sec % 60
    return `${m} min ${s > 0 ? s + ' sek' : ''}`
  }

  // 🔥 Реальная отправка по одному с задержкой (Оркестрация на фронте)
  const handleStart = async () => {
    if (studentsToSend.length === 0) return
    setStep('sending')
    cancelRef.current = false

    for (let i = 0; i < studentsToSend.length; i++) {
      if (cancelRef.current) break

      const student = studentsToSend[i]

      try {
        const res = await sendMutation.mutateAsync({
          month: monthNum,
          year: yearNum,
          messages: [
            {
              alfaId: student.alfaId,
              name: student.name,
              amountCalculated: student.amountCalculated,
              messageBody: student.messageBody,
              tgChatId: student.tgChatId // Обязательно string или null (не undefined!)
            }
          ]
        })

        if (res.status === 'FAILED' || res.status === 'PARTIAL') {
          setErrors((prev) => [...prev, ...res.errStatuses])
        } else {
          setSentIds((prev) => [...prev, student.alfaId])
        }
      } catch (err: any) {
        setErrors((prev) => [
          ...prev,
          { alfaId: student.alfaId, name: student.name, reason: err.message || 'Błąd sieci' }
        ])
      }

      setProgress(i + 1)

      // Ждем указанный delay перед следующим запросом (если не нажата отмена и это не последний элемент)
      if (i < studentsToSend.length - 1 && !cancelRef.current) {
        await new Promise((resolve) => setTimeout(resolve, delayMs))
      }
    }

    if (!cancelRef.current) {
      setStep('finished')
    }
  }

  const handleCancel = () => {
    cancelRef.current = true
    setStep('cancelled')
  }

  const handleClose = () => {
    if (step === 'finished' || step === 'cancelled') onComplete(sentIds)
    onOpenChange(false)
  }

  // Финальный экран
  const FinalReport = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-secondary/50 p-4 rounded-xl border border-border text-center">
          <div className="text-2xl font-bold">{progress}</div>
          <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">
            Przetworzono
          </div>
        </div>
        <div className="bg-success/10 p-4 rounded-xl border border-success/20 text-center">
          <div className="text-2xl font-bold text-success">{sentIds.length}</div>
          <div className="text-xs text-success/80 uppercase tracking-wider mt-1">Wysłano</div>
        </div>
        <div
          className={cn(
            'p-4 rounded-xl border text-center',
            errors.length > 0
              ? 'bg-destructive/10 border-destructive/20'
              : 'bg-secondary/50 border-border'
          )}
        >
          <div className={cn('text-2xl font-bold', errors.length > 0 && 'text-destructive')}>
            {errors.length}
          </div>
          <div
            className={cn(
              'text-xs uppercase tracking-wider mt-1',
              errors.length > 0 ? 'text-destructive/80' : 'text-muted-foreground'
            )}
          >
            Błędy
          </div>
        </div>
      </div>
      {errors.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center text-destructive">
            <AlertCircle className="w-4 h-4 mr-2" /> Szczegóły błędów
          </Label>
          <div className="bg-destructive/5 rounded-xl border border-destructive/10 overflow-hidden">
            <div className="max-h-[150px] overflow-y-auto custom-scrollbar p-1">
              {errors.map((err, idx) => (
                <div
                  key={idx}
                  className="flex justify-between items-center py-2 px-3 hover:bg-destructive/10 rounded-lg text-sm transition-colors"
                >
                  <span className="font-medium text-foreground">
                    {err.name}{' '}
                    <span className="text-muted-foreground text-xs font-normal">#{err.alfaId}</span>
                  </span>
                  <span className="text-destructive text-xs">{err.reason}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {errors.length === 0 && progress > 0 && (
        <div className="flex items-start bg-primary/5 text-primary p-3 rounded-xl text-sm">
          <Info className="w-4 h-4 mr-2 shrink-0 mt-0.5" />
          <p>
            Wszystkie wiadomości zostały przetworzone pomyślnie. Historia wysyłki została
            zaktualizowana.
          </p>
        </div>
      )}
    </div>
  )

  return (
    <Dialog open={isOpen} onOpenChange={step === 'sending' ? undefined : handleClose}>
      <DialogContent
        className="sm:max-w-md rounded-2xl"
        onInteractOutside={(e) => step === 'sending' && e.preventDefault()}
        onEscapeKeyDown={(e) => step === 'sending' && e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>
            {step === 'settings' && 'Ustawienia wysyłki'}
            {step === 'sending' && 'Wysyłanie wiadomości'}
            {(step === 'finished' || step === 'cancelled') && 'Podsumowanie wysyłki'}
          </DialogTitle>
          <DialogDescription>
            {step === 'settings' && 'Skonfiguruj parametry przed rozpoczęciem masowej wysyłki.'}
            {step === 'sending' && 'Proszę czekać, nie zamykaj tego okna do zakończenia procesu.'}
            {(step === 'finished' || step === 'cancelled') &&
              (step === 'cancelled'
                ? 'Proces został przerwany przez użytkownika.'
                : 'Proces wysyłania został zakończony.')}
          </DialogDescription>
        </DialogHeader>

        {step === 'settings' && (
          <div className="py-4 space-y-6">
            <div className="space-y-4 bg-secondary/50 p-4 rounded-xl border border-border">
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <Label htmlFor="skip-sent" className="text-sm font-medium cursor-pointer">
                    Pomiń już wysłane
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Nie wysyłaj do osób, które już otrzymały wiadomość w tym miesiącu.
                  </p>
                </div>
                <Checkbox
                  id="skip-sent"
                  checked={skipSent}
                  onCheckedChange={(checked) => setSkipSent(!!checked)}
                  className="h-5 w-5 rounded-md"
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label>Opóźnienie między wiadomościami</Label>
              <Select value={delayStr} onValueChange={setDelayStr}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Wybierz opóźnienie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1000">1 sekunda (Szybko)</SelectItem>
                  <SelectItem value="2000">2 sekundy (Optymalnie)</SelectItem>
                  <SelectItem value="5000">5 sekund (Bezpiecznie dla API)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="bg-primary/5 p-4 rounded-xl border border-primary/10 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Wybrano ogółem:</span>
                <span className="font-medium">{selectedStudents.length} os.</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Do wysłania (po filtracji):</span>
                <span className="font-bold text-primary">{studentsToSend.length} os.</span>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t border-primary/10 mt-2">
                <span className="text-muted-foreground flex items-center">
                  <Clock className="w-4 h-4 mr-1.5" /> Szacowany czas:
                </span>
                <span className="font-medium">{formatTime(totalTimeSec)}</span>
              </div>
            </div>

            {studentsToSend.length === 0 && (
              <div className="flex items-center text-warning text-sm font-medium">
                <AlertCircle className="w-4 h-4 mr-2" /> Brak odbiorców. Zmień filtry, aby
                kontynuować.
              </div>
            )}
          </div>
        )}

        {step === 'sending' && (
          <div className="py-6 space-y-6">
            <div className="flex justify-between items-center text-sm font-medium">
              <span className="text-muted-foreground">Postęp wysyłania:</span>
              <span>
                {progress} / {studentsToSend.length}
              </span>
            </div>
            <div className="h-3 w-full bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full transition-all duration-300 ease-out bg-primary"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <div className="flex flex-col items-center justify-center pt-2 gap-1 text-sm">
              <div className="flex items-center text-muted-foreground">
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Wysyłanie...
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Pozostało ok. {formatTime(timeLeftSec)}
              </div>
            </div>
          </div>
        )}

        {(step === 'finished' || step === 'cancelled') && (
          <div className="py-2">
            <FinalReport />
          </div>
        )}

        <DialogFooter className="sm:justify-between mt-2">
          {step === 'settings' && (
            <>
              <Button
                variant="outline"
                className="rounded-xl w-full sm:w-auto"
                onClick={handleClose}
              >
                Anuluj
              </Button>
              <Button
                className="rounded-xl w-full sm:w-auto"
                onClick={handleStart}
                disabled={studentsToSend.length === 0}
              >
                Rozpocznij wysyłanie
              </Button>
            </>
          )}
          {step === 'sending' && (
            <Button variant="destructive" className="rounded-xl w-full" onClick={handleCancel}>
              Przerwij wysyłanie
            </Button>
          )}
          {(step === 'finished' || step === 'cancelled') && (
            <Button className="rounded-xl w-full" onClick={handleClose}>
              Zakończ i zamknij
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
