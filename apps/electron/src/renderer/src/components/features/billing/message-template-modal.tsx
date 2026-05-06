import { useRef, useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/shared/ui/dialog'
import { Label } from '@/components/shared/ui/label'
import { Input } from '@/components/shared/ui/input'
import { Textarea } from '@/components/shared/ui/textarea'
import { Button } from '@/components/shared/ui/button'
import { toast } from 'sonner'
import { trpc } from '@/lib/trpc'
import { type BillingTemplate } from '@btw-app/shared'
import { Database, Eye, Type, Repeat, ArrowDownRight, Loader2 } from 'lucide-react'

type LocalTemplateState = {
  id?: number
  name: string
  body: string
}

interface MessageTemplateModalProps {
  isOpen: boolean
  onClose: () => void
  templateToEdit: BillingTemplate | null
}

const MAIN_VARIABLES = [
  { tag: '{{name}}', label: 'Imię ucznia' },
  { tag: '{{amount}}', label: 'Kwota do zapłaty (PLN)' },
  { tag: '{{month}}', label: 'Miesiąc rozliczeniowy' },
  { tag: '{{remainder}}', label: 'Stan konta na 1. dzień' },
  { tag: '{{lessons-price}}', label: 'Koszt lekcji' }
]

const LOOP_VARIABLES = [
  { tag: '{{subject_name}}', label: 'Nazwa przedmiotu' },
  { tag: '{{quantity}}', label: 'Liczba zajęć' }
]

const DEFAULT_LOOP_BLOCK = `
{{#each subjects}}
- {{subject_name}} ({{quantity}} zaj.)
{{/each}}
`

export default function MessageTemplateModal({
  isOpen,
  onClose,
  templateToEdit
}: MessageTemplateModalProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [localTemplate, setLocalTemplate] = useState<LocalTemplateState | null>(null)
  const trpcUtils = trpc.useUtils()

  const createMut = trpc.billingTemplate.create.useMutation({
    onSuccess: () => {
      toast.success('Szablon został utworzony')
      trpcUtils.billingTemplate.getAll.invalidate().then()
      onClose()
    }
  })

  const updateMut = trpc.billingTemplate.update.useMutation({
    onSuccess: () => {
      toast.success('Szablon został zaktualizowany')
      trpcUtils.billingTemplate.getAll.invalidate().then()
      onClose()
    }
  })

  const deleteMut = trpc.billingTemplate.delete.useMutation({
    onSuccess: () => {
      toast.success('Szablon został usunięty')
      trpcUtils.billingTemplate.getAll.invalidate().then()
      onClose()
    }
  })

  const isSaving = createMut.isPending || updateMut.isPending
  const isDeleting = deleteMut.isPending

  useEffect(() => {
    if (isOpen) {
      setLocalTemplate(templateToEdit ? { ...templateToEdit } : { name: '', body: '' })
    } else {
      setLocalTemplate(null)
    }
  }, [isOpen, templateToEdit])

  const insertText = (text: string) => {
    if (!textareaRef.current || !localTemplate) return
    const textarea = textareaRef.current
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const currentBody = localTemplate.body
    const newBody = currentBody.substring(0, start) + text + currentBody.substring(end)

    setLocalTemplate({ ...localTemplate, body: newBody })

    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + text.length, start + text.length)
    }, 0)
  }

  const handleSaveClick = () => {
    if (!localTemplate?.name?.trim() || !localTemplate?.body?.trim()) {
      toast.error('Wypełnij wszystkie pola')
      return
    }

    if (localTemplate.id) {
      updateMut.mutate({
        id: localTemplate.id,
        name: localTemplate.name,
        body: localTemplate.body
      })
    } else {
      createMut.mutate({
        name: localTemplate.name,
        body: localTemplate.body
      })
    }
  }

  const handleDeleteClick = () => {
    if (localTemplate?.id) {
      deleteMut.mutate({ id: localTemplate.id })
    }
  }

  const renderLivePreview = () => {
    if (!localTemplate?.body)
      return <span className="text-muted-foreground italic">Brak treści wiadomości.</span>

    let previewText = localTemplate.body

    // 1. Подменяем базовые переменные
    previewText = previewText.replace(/{{name}}/g, 'Иван Петров')
    previewText = previewText.replace(/{{month}}/g, 'Октябрь')
    previewText = previewText.replace(/{{remainder}}/g, '120.00')
    previewText = previewText.replace(/{{lessons-price}}/g, '570.00')
    previewText = previewText.replace(/{{amount}}/g, '450.00')

    // 2. Имитируем цикл предметов
    const mockSubjects = [
      { subject_name: 'Физика', quantity: '4' },
      { subject_name: 'Математика', quantity: '2' }
    ]

    // Ищем блок {{#each subjects}} ... {{/each}}
    const loopRegex = /{{\s*#each\s+subjects\s*}}([\s\S]*?){{\s*\/each\s*}}/g

    previewText = previewText.replace(loopRegex, (_match, loopBody) => {
      // 🔥 Очищаем блок от лишних переносов строк по краям
      const cleanBody = loopBody.trim()

      // Для каждого предмета заменяем переменные
      return mockSubjects
        .map((sub) => {
          return cleanBody
            .replace(/{{subject_name}}/g, sub.subject_name)
            .replace(/{{quantity}}/g, sub.quantity)
        })
        .join('\n')
    })

    return previewText
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[90vw] lg:max-w-[1200px] w-full bg-card border-border/50 rounded-3xl p-6 md:p-8 flex flex-col h-[90vh] md:h-auto">
        <DialogHeader className="mb-4 shrink-0">
          <DialogTitle className="text-2xl font-bold tracking-tight text-foreground">
            {localTemplate?.id ? 'Edytuj szablon' : 'Nowy szablon wiadomości'}
          </DialogTitle>
        </DialogHeader>

        {localTemplate && (
          <div className="flex-1 flex flex-col gap-6 min-h-0 overflow-y-auto custom-scrollbar md:overflow-visible pr-2">
            <div className="space-y-2 shrink-0">
              <Label className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                <Type className="h-4 w-4" /> Nazwa szablonu
              </Label>
              <Input
                value={localTemplate.name}
                onChange={(e) => setLocalTemplate({ ...localTemplate, name: e.target.value })}
                placeholder="np. Miesięczne podsumowanie - Rodzic"
                className="bg-secondary/50 border-none rounded-xl h-12 text-base font-medium focus-visible:ring-2 focus-visible:ring-primary/50"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 min-h-[400px]">
              {/* Колоннка 1: Переменные */}
              <div className="flex flex-col h-full bg-secondary/30 border border-border/50 rounded-2xl p-4 overflow-y-auto custom-scrollbar">
                <Label className="text-sm font-semibold text-muted-foreground flex items-center gap-2 mb-4 shrink-0">
                  <Database className="h-4 w-4" /> Zmienne
                </Label>

                <div className="space-y-6">
                  {/* Основные переменные */}
                  <div className="space-y-2">
                    <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
                      Dane ogólne
                    </p>
                    <div className="flex flex-col gap-2">
                      {MAIN_VARIABLES.map((v) => (
                        <Button
                          key={v.tag}
                          variant="secondary"
                          onClick={() => insertText(v.tag)}
                          className="justify-start h-auto py-2 px-3 rounded-lg border border-border/50 hover:border-primary/50 transition-colors bg-card hover:bg-card flex-col items-start gap-1 shadow-sm"
                        >
                          <span className="font-mono text-primary font-bold text-xs">{v.tag}</span>
                          <span className="text-[11px] font-medium text-muted-foreground">
                            {v.label}
                          </span>
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Блок цикла */}
                  <div className="space-y-2 bg-primary/5 p-3 rounded-xl border border-primary/10">
                    <p className="text-[11px] font-bold text-primary uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Repeat className="h-3 w-3" /> Pętla Przedmiotów
                    </p>
                    <p className="text-[11px] text-muted-foreground leading-tight mb-3 font-medium">
                      Wstaw główny blok pętli, a następnie edytuj tekst wewnątrz niego.
                    </p>

                    <Button
                      onClick={() => insertText(DEFAULT_LOOP_BLOCK)}
                      className="w-full text-xs h-8 mb-4 shadow-sm bg-primary/10 text-primary hover:bg-primary/20"
                    >
                      Wstaw blok pętli
                    </Button>

                    <div className="pl-2 border-l-2 border-primary/20 space-y-2">
                      <p className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                        <ArrowDownRight className="h-3 w-3" /> Zmienne w pętli:
                      </p>
                      {LOOP_VARIABLES.map((v) => (
                        <Button
                          key={v.tag}
                          variant="ghost"
                          onClick={() => insertText(v.tag)}
                          className="justify-start w-full h-auto py-1.5 px-2 rounded-md hover:bg-primary/10 flex-col items-start gap-0.5"
                        >
                          <span className="font-mono text-primary font-bold text-[11px]">
                            {v.tag}
                          </span>
                          <span className="text-[10px] font-normal text-muted-foreground">
                            {v.label}
                          </span>
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Колоннка 2: Редактор */}
              <div className="space-y-3 flex flex-col h-full">
                <Label className="text-sm font-semibold text-muted-foreground">
                  Treść wiadomości
                </Label>
                <Textarea
                  ref={textareaRef}
                  value={localTemplate.body}
                  onChange={(e) => setLocalTemplate({ ...localTemplate, body: e.target.value })}
                  placeholder="Wpisz treść wiadomości. Użyj zmiennych z listy obok..."
                  className="flex-1 bg-secondary/50 resize-none font-mono text-[13px] rounded-2xl leading-relaxed p-4 border-none focus-visible:ring-2 focus-visible:ring-primary/50"
                />
              </div>

              {/* Колоннка 3: Live Preview */}
              <div className="space-y-3 flex flex-col h-full bg-gradient-to-br from-primary/5 to-accent/10 border border-border/50 rounded-2xl p-4">
                <Label className="text-sm font-semibold text-primary uppercase flex items-center gap-2 mb-2 shrink-0">
                  <Eye className="h-4 w-4" /> Podgląd na żywo
                </Label>
                <div className="flex-1 bg-card rounded-xl border border-border/50 p-4 overflow-y-auto custom-scrollbar shadow-inner">
                  <div className="whitespace-pre-wrap break-words text-[13px] text-foreground font-sans">
                    {renderLivePreview()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6 pt-6 border-t border-border/50 shrink-0">
          <div>
            {localTemplate?.id && (
              <Button
                variant="destructive"
                className="rounded-xl bg-accent/10 text-accent hover:bg-accent/20"
                onClick={handleDeleteClick}
                disabled={isDeleting || isSaving}
              >
                {isDeleting ? 'Usuwanie...' : 'Usuń szablon'}
              </Button>
            )}
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <Button
              variant="outline"
              className="rounded-xl flex-1 sm:flex-none"
              onClick={onClose}
              disabled={isSaving || isDeleting}
            >
              Anuluj
            </Button>
            <Button
              className="rounded-xl flex-1 sm:flex-none"
              onClick={handleSaveClick}
              disabled={isSaving || isDeleting}
            >
              {(isSaving || isDeleting) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isSaving ? 'Zapisywanie...' : 'Zapisz szablon'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
