import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/shared/ui/dialog'
import { Button } from '@/components/shared/ui/button'
import { Textarea } from '@/components/shared/ui/textarea'
import { Customer } from '@btw-app/shared'
import { CustomerSelector } from '../../customers/customer-selector'
import { trpc } from '@/lib/trpc'
import { toast } from 'sonner'
import { Loader2, Send, ArrowRight, ArrowLeft } from 'lucide-react'

interface SendExtraReportModalProps {
  isOpen: boolean
  onClose: () => void
}

export function SendExtraReportModal({ isOpen, onClose }: SendExtraReportModalProps) {
  const [step, setStep] = useState<1 | 2>(1)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [message, setMessage] = useState('')

  // Мутация для отправки сообщения (используем существующий роут для сообщений)
  const sendMessageMut = trpc.message.sendSingleMessage.useMutation({
    onSuccess: () => {
      toast.success('Wiadomość została wysłana!')
      handleClose()
    },
    onError: (e) => toast.error(`Błąd wysyłania: ${e.message}`)
  })

  const handleClose = () => {
    onClose()
    // Небольшая задержка перед сбросом стейта, чтобы модалка успела закрыться без дерганий
    setTimeout(() => {
      setStep(1)
      setSelectedCustomer(null)
      setMessage('')
    }, 300)
  }

  const handleSend = () => {
    if (!selectedCustomer) return
    sendMessageMut.mutate({
      alfaId: selectedCustomer.alfaId,
      messageBody: message,
      targetAudience: 'PARENT', // Обычно внеочередные отчеты идут родителю
      studentTgChatId: selectedCustomer.studentTgChatId,
      parentTgChatId: selectedCustomer.parentTgChatId
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px] rounded-2xl h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
        <div className="p-6 pb-4 shrink-0 border-b border-border bg-card">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <Send className="w-5 h-5 text-primary" />
              Wyślij raport poza cyklem
            </DialogTitle>
            <DialogDescription>
              {step === 1
                ? 'Wybierz ucznia z listy poniżej, aby wysłać do jego rodzica niestandardową wiadomość.'
                : `Piszesz do rodzica ucznia: ${selectedCustomer?.name}`}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="flex-1 overflow-hidden p-6 bg-muted/10">
          {step === 1 && (
            <CustomerSelector
              onSelect={setSelectedCustomer}
              selectedCustomerId={selectedCustomer?.alfaId}
            />
          )}

          {step === 2 && (
            <div className="h-full flex flex-col">
              <Textarea
                placeholder="Wpisz treść raportu..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="flex-1 resize-none rounded-xl text-sm leading-relaxed p-4 bg-background shadow-inner custom-scrollbar"
                autoFocus
              />
              <p className="text-xs text-muted-foreground mt-3 font-medium flex items-center justify-between">
                <span>Wiadomość zostanie wysłana na konto Telegram rodzica.</span>
                {!selectedCustomer?.parentTgChatId && (
                  <span className="text-destructive font-bold">Brak konta TG rodzica w bazie!</span>
                )}
              </p>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-border shrink-0 bg-card flex justify-between items-center">
          {step === 1 ? (
            <>
              <Button variant="ghost" onClick={handleClose} className="rounded-xl">
                Anuluj
              </Button>
              <Button
                onClick={() => setStep(2)}
                disabled={!selectedCustomer}
                className="rounded-xl"
              >
                Dalej <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                onClick={() => setStep(1)}
                className="rounded-xl"
                disabled={sendMessageMut.isLoading}
              >
                <ArrowLeft className="w-4 h-4 mr-2" /> Wróć
              </Button>
              <Button
                onClick={handleSend}
                disabled={!message.trim() || sendMessageMut.isLoading}
                className="rounded-xl"
              >
                {sendMessageMut.isLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 mr-2" />
                )}
                Wyślij wiadomość
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
