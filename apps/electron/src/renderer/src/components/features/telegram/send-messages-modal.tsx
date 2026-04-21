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
import { Textarea } from '@/components/shared/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/shared/ui/select'
import { Loader2, Clock, Send, AlertTriangle, AlertCircle, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import { trpc } from '@/lib/trpc'
import { BaseRecipient } from '@btw-app/shared'

type Audience = 'STUDENT' | 'PARENT' | 'TEACHER'
type Step = 'settings' | 'warning' | 'sending' | 'finished' | 'cancelled'
type SendError = { id: string | number; name: string; reason: string }
const DEFAULT_AUDIENCES: Array<Audience> = ['STUDENT', 'PARENT']

interface SendMessagesModalProps<T extends BaseRecipient> {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  items: T[]
  showSkipSent?: boolean
  requireMessageBody?: boolean
  getContactId: (item: T, audience: Audience) => string | null | undefined
  availableAudiences?: Array<Audience>
  onProcessItem: (item: T, customMessage: string, targetAudience: Audience) => Promise<void>
  onComplete: (sentIds: Array<string | number>) => void
}

export function SendMessagesModal<T extends BaseRecipient>({
  isOpen,
  onOpenChange,
  items,
  showSkipSent = false,
  requireMessageBody = false,
  getContactId,
  availableAudiences = DEFAULT_AUDIENCES,
  onProcessItem,
  onComplete
}: SendMessagesModalProps<T>) {
  // Context & Stores
  const { data: tgStatus, isLoading: isStatusLoading } = trpc.telegram.status.useQuery(undefined, {
    enabled: isOpen
  })

  // Local State
  const [step, setStep] = useState<Step>('settings')
  const [skipSent, setSkipSent] = useState(showSkipSent)
  const [delayStr, setDelayStr] = useState('2000')
  const [progress, setProgress] = useState(0)
  const [sentIds, setSentIds] = useState<Array<string | number>>([])
  const [errors, setErrors] = useState<SendError[]>([])
  const [customMessage, setCustomMessage] = useState('')
  const [targetAudience, setTargetAudience] = useState<Audience>(availableAudiences[0])
  const [missingContacts, setMissingContacts] = useState<T[]>([])
  const cancelRef = useRef(false)

  // Derived State
  const delayMs = parseInt(delayStr, 10)

  const itemsToSend = useMemo(() => {
    if (showSkipSent && skipSent) return items.filter((s) => !s.isSent)
    return items
  }, [items, skipSent, showSkipSent])

  const totalTimeSec = Math.ceil((itemsToSend.length * delayMs) / 1000)
  const timeLeftSec = Math.ceil(((itemsToSend.length - progress) * delayMs) / 1000)
  const progressPercentage =
    itemsToSend.length > 0 ? Math.round((progress / itemsToSend.length) * 100) : 0

  const audienceLabels = {
    STUDENT: 'Uczeń',
    PARENT: 'Rodzic / Opiekun',
    TEACHER: 'Nauczyciel'
  }

  // Handlers & Callbacks
  const formatTime = (sec: number) => {
    if (sec < 60) return `${sec} sek`
    const m = Math.floor(sec / 60)
    const s = sec % 60
    return `${m} min ${s > 0 ? s + ' sek' : ''}`
  }

  const handleStartCheck = () => {
    if (itemsToSend.length === 0) return
    if (requireMessageBody && !customMessage.trim()) return

    const missing = itemsToSend.filter((item) => {
      const contactId = getContactId(item, targetAudience)
      return !contactId
    })

    if (missing.length > 0) {
      setMissingContacts(missing)
      setStep('warning')
      return
    }

    executeSend()
  }

  const executeSend = async () => {
    setStep('sending')
    cancelRef.current = false

    for (let i = 0; i < itemsToSend.length; i++) {
      if (cancelRef.current) break

      const currentItem = itemsToSend[i]

      try {
        const contactId = getContactId(currentItem, targetAudience)
        if (!contactId) {
          throw new Error('Brak podłączonego Telegrama')
        }

        await onProcessItem(currentItem, customMessage, targetAudience)
        setSentIds((prev) => [...prev, currentItem.id])
      } catch (err: any) {
        setErrors((prev) => [
          ...prev,
          {
            id: currentItem.id,
            name: currentItem.name,
            reason: err.message || 'Błąd sieci'
          }
        ])
      }

      setProgress(i + 1)

      if (i < itemsToSend.length - 1 && !cancelRef.current) {
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

  // Effects
  useEffect(() => {
    if (isOpen) {
      setStep('settings')
      setProgress(0)
      setSentIds([])
      setErrors([])
      setSkipSent(showSkipSent)
      setCustomMessage('')
      setTargetAudience(availableAudiences[0])
      setMissingContacts([])
      cancelRef.current = false
    }
  }, [isOpen, showSkipSent, availableAudiences])

  // Early returns
  if (isStatusLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md rounded-2xl flex items-center justify-center p-12">
          <DialogTitle className="sr-only">Ładowanie statusu</DialogTitle>
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </DialogContent>
      </Dialog>
    )
  }

  if (!tgStatus?.isConnected) {
    return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md rounded-2xl p-0 overflow-hidden">
          <DialogTitle className="sr-only">Brak połączenia z Telegramem</DialogTitle>
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-6">
              <Send className="w-8 h-8 text-destructive ml-1" />
            </div>
            <h3 className="text-xl font-bold text-foreground">Brak połączenia z Telegramem</h3>
            <p className="text-sm text-muted-foreground mt-2 mb-8">
              Aby rozpocząć masową wysyłkę, musisz najpierw podłączyć konto do powiadomień w
              zakładce <b>Ustawienia</b>.
            </p>
            <Button className="w-full rounded-xl" onClick={() => onOpenChange(false)}>
              Zrozumiałem
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

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
                    <span className="text-muted-foreground text-xs font-normal">#{err.id}</span>
                  </span>
                  <span className="text-destructive text-xs ml-2 text-right">{err.reason}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {errors.length === 0 && progress > 0 && (
        <div className="flex items-start bg-primary/5 text-primary p-3 rounded-xl text-sm">
          <Info className="w-4 h-4 mr-2 shrink-0 mt-0.5" />
          <p>Wszystkie wiadomości zostały przetworzone pomyślnie.</p>
        </div>
      )}
    </div>
  )

  // Main Return
  return (
    <Dialog open={isOpen} onOpenChange={step === 'sending' ? undefined : handleClose}>
      <DialogContent
        className="sm:max-w-md rounded-2xl"
        onInteractOutside={(e) => step === 'sending' && e.preventDefault()}
        onEscapeKeyDown={(e) => step === 'sending' && e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>
            {step === 'settings'
              ? 'Ustawienia wysyłki'
              : step === 'warning'
                ? 'Uwaga - braki в kontaktach'
                : step === 'sending'
                  ? 'Wysyłanie wiadomości'
                  : 'Podsumowanie wysyłki'}
          </DialogTitle>
          <DialogDescription>
            {step === 'settings'
              ? 'Skonfiguruj parametry przed rozpoczęciem masowej wysyłki.'
              : step === 'warning'
                ? 'Przejrzyj braki przed wysłaniem.'
                : step === 'sending'
                  ? 'Proszę czekać, nie zamykaj tego okна do zakończenia procesu.'
                  : step === 'cancelled'
                    ? 'Proces został przerwany przez użytkownika.'
                    : 'Proces wysyłania został zakończony.'}
          </DialogDescription>
        </DialogHeader>

        {step === 'settings' && (
          <div className="py-4 space-y-6">
            {availableAudiences.length > 1 && (
              <div className="space-y-2">
                <Label>Odbiorca wiadomości</Label>
                <div className="flex gap-3">
                  {availableAudiences.map((aud) => (
                    <Button
                      key={aud}
                      variant={targetAudience === aud ? 'default' : 'outline'}
                      onClick={() => setTargetAudience(aud)}
                      className="flex-1 rounded-xl"
                    >
                      {audienceLabels[aud]}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {requireMessageBody && (
              <div className="space-y-2">
                <Label>Treść wiadomości</Label>
                <Textarea
                  placeholder="Wpisz tekst, który chcesz wysłać..."
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  className="min-h-[120px] rounded-xl resize-none"
                />
              </div>
            )}

            {showSkipSent && (
              <div className="space-y-4 bg-secondary/50 p-4 rounded-xl border border-border">
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <Label htmlFor="skip-sent" className="text-sm font-medium cursor-pointer">
                      Pomiń już wysłane
                    </Label>
                  </div>
                  <Checkbox
                    id="skip-sent"
                    checked={skipSent}
                    onCheckedChange={(checked) => setSkipSent(!!checked)}
                    className="h-5 w-5 rounded-md"
                  />
                </div>
              </div>
            )}

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
                <span className="font-medium">{items.length} os.</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Do wysłania:</span>
                <span className="font-bold text-primary">{itemsToSend.length} os.</span>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t border-primary/10 mt-2">
                <span className="text-muted-foreground flex items-center">
                  <Clock className="w-4 h-4 mr-1.5" /> Szacowany czas:
                </span>
                <span className="font-medium">{formatTime(totalTimeSec)}</span>
              </div>
            </div>
          </div>
        )}

        {step === 'warning' && (
          <div className="py-6 space-y-4 text-center">
            <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-amber-500" />
            </div>
            <h3 className="text-xl font-bold">Braki в kontaktach</h3>
            <p className="text-sm text-muted-foreground">
              <b>{missingContacts.length}</b> z wybranych osób nie ma przypisanego ID Telegrama.
            </p>
            <p className="text-sm text-muted-foreground">
              Wiadomości do nich zostaną pominięте i zapisane jako błędy. Czy chcesz kontynuować
              wysyłkę do pozostałych?
            </p>
          </div>
        )}

        {step === 'sending' && (
          <div className="py-6 space-y-6">
            <div className="flex justify-between items-center text-sm font-medium">
              <span className="text-muted-foreground">Postęp wysyłania:</span>
              <span>
                {progress} / {itemsToSend.length}
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
                onClick={() => onOpenChange(false)}
              >
                Anuluj
              </Button>
              <Button
                className="rounded-xl w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={handleStartCheck}
                disabled={itemsToSend.length === 0 || (requireMessageBody && !customMessage.trim())}
              >
                Rozpocznij wysyłanie
              </Button>
            </>
          )}
          {step === 'warning' && (
            <>
              <Button
                variant="outline"
                className="rounded-xl w-full sm:w-auto"
                onClick={() => setStep('settings')}
              >
                Wróć
              </Button>
              <Button
                className="rounded-xl w-full sm:w-auto bg-amber-500 text-white hover:bg-amber-600"
                onClick={executeSend}
              >
                Kontynuuj (Pomiń braki)
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
