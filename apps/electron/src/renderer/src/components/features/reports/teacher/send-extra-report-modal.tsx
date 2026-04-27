import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/shared/ui/dialog'
import { Button } from '@/components/shared/ui/button'
import { Textarea } from '@/components/shared/ui/textarea'
import { Input } from '@/components/shared/ui/input'
import { Customer } from '@btw-app/shared'
import { CustomerSelector } from '../../customers/customer-selector'
import { trpc } from '@/lib/trpc'
import { toast } from 'sonner'
import { Loader2, Send, ArrowRight, ArrowLeft, Lock, Unlock, AlertTriangle } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'

interface SendExtraReportModalProps {
  isOpen: boolean
  onClose: () => void
}

export function SendExtraReportModal({ isOpen, onClose }: SendExtraReportModalProps) {
  const { user } = useAuthStore()

  const [step, setStep] = useState<1 | 2>(1)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)

  // 🔥 Новые стейты для шаблона
  const [isTemplateLocked, setIsTemplateLocked] = useState(true)
  const [subjectName, setSubjectName] = useState('')
  const [comment, setComment] = useState('')
  const [customMessage, setCustomMessage] = useState('')

  const teacherName = user?.name || 'Wykładowca'
  const studentName = selectedCustomer?.name || 'Uczeń'

  const sendMessageMut = trpc.message.sendSingleMessage.useMutation({
    onSuccess: () => {
      toast.success('Wiadomość została wysłana!')
      handleClose()
    },
    onError: (e) => toast.error(`Błąd wysyłania: ${e.message}`)
  })

  const handleClose = () => {
    onClose()
    setTimeout(() => {
      setStep(1)
      setSelectedCustomer(null)
      setIsTemplateLocked(true)
      setSubjectName('')
      setComment('')
      setCustomMessage('')
    }, 300)
  }

  // 🔥 Функция для склеивания шаблона в одну строку
  const getCompiledMessage = () => {
    if (!isTemplateLocked) return customMessage

    const subjectPart = subjectName.trim() ? ` по предмету ${subjectName.trim()}` : ''

    return `Добрый день! 👋\n\nВам пришло сообщение от преподавателя ${teacherName}${subjectPart}.\n\n📚 Комментарий:\n${comment}\n\n👦 Ученик: ${studentName}`
  }

  const handleSend = () => {
    if (!selectedCustomer) return
    sendMessageMut.mutate({
      alfaId: selectedCustomer.alfaId,
      messageBody: getCompiledMessage(), // Отправляем итоговый текст
      targetAudience: 'PARENT',
      studentTgChatId: selectedCustomer.studentTgChatId,
      parentTgChatId: selectedCustomer.parentTgChatId
    })
  }

  const handleToggleLock = () => {
    if (isTemplateLocked) {
      // При разблокировке генерируем текущий текст и кладем в customMessage
      setCustomMessage(getCompiledMessage())
      setIsTemplateLocked(false)
    } else {
      setIsTemplateLocked(true)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[750px] rounded-2xl h-[85vh] flex flex-col p-0 gap-0 overflow-hidden bg-card border-border">
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
            <div className="h-full flex flex-col gap-4">
              {/* Верхняя панель управления шаблоном */}
              <div className="flex items-center justify-between bg-card p-2 rounded-xl border border-border shadow-sm">
                <span className="text-sm font-semibold text-muted-foreground ml-2">
                  Struktura wiadomości
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleToggleLock}
                  className={
                    isTemplateLocked
                      ? 'text-muted-foreground'
                      : 'text-amber-500 hover:text-amber-600 bg-amber-500/10'
                  }
                >
                  {isTemplateLocked ? (
                    <>
                      <Unlock className="w-4 h-4 mr-2" /> Odblokuj edycję całości
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4 mr-2" /> Wróć do bezpiecznego szablonu
                    </>
                  )}
                </Button>
              </div>

              {/* Предупреждение при разблокировке */}
              {!isTemplateLocked && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-600 rounded-xl flex gap-2 items-start text-sm shrink-0">
                  <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                  <p>
                    Edytujesz cały szablon ręcznie. <strong>Lepiej nic nie zmieniać</strong> poza
                    komentarzem, aby zachować standardowy i czytelny format wiadomości dla rodzica.
                  </p>
                </div>
              )}

              {/* Рендер редактора (Заблокированный VS Разблокированный) */}
              {isTemplateLocked ? (
                <div className="flex-1 flex flex-col gap-3 p-5 bg-background border border-border rounded-xl overflow-y-auto custom-scrollbar shadow-sm">
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    Добрый день! 👋{'\n\n'}
                    Вам пришло сообщение от преподавателя <strong>{teacherName}</strong>
                  </p>

                  <div className="flex items-center gap-2 -mt-1 flex-wrap">
                    <span className="text-sm text-muted-foreground">по предмету</span>
                    <Input
                      value={subjectName}
                      onChange={(e) => setSubjectName(e.target.value)}
                      placeholder="np. Chemia (opcjonalnie)"
                      className="h-8 text-sm bg-secondary w-[200px] rounded-lg"
                    />
                    <span className="text-sm text-muted-foreground">.</span>
                  </div>

                  <p className="text-sm text-muted-foreground mt-2">📚 Комментарий:</p>

                  <Textarea
                    placeholder="Wpisz tutaj to, co chcesz przekazać rodzicowi..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="min-h-[160px] resize-none rounded-xl text-sm leading-relaxed p-4 bg-secondary/30 border-2 border-dashed border-muted-foreground/30 focus-visible:border-primary focus-visible:ring-0 shadow-none"
                    autoFocus
                  />

                  <p className="text-sm text-muted-foreground whitespace-pre-wrap mt-2">
                    👦 Ученик: <strong>{studentName}</strong>
                  </p>
                </div>
              ) : (
                <Textarea
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  className="flex-1 resize-none rounded-xl text-sm leading-relaxed p-4 bg-background shadow-inner custom-scrollbar border-border"
                  autoFocus
                />
              )}

              <p className="text-xs text-muted-foreground mt-1 font-medium flex items-center justify-between shrink-0">
                <span>Wiadomość zostanie wysłana na konto Telegram rodzica.</span>
                {!selectedCustomer?.parentTgChatId && (
                  <span className="text-destructive font-bold">Brak konta TG rodzica w bazie!</span>
                )}
              </p>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-border shrink-0 bg-card flex justify-between items-center z-10">
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
                disabled={
                  sendMessageMut.isLoading ||
                  (isTemplateLocked ? !comment.trim() : !customMessage.trim())
                }
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
