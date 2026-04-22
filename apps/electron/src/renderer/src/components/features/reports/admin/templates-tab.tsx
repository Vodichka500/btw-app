'use client'

import { useState, useRef, useMemo } from 'react'
import { Plus, Trash2, Pencil, Save, Loader2, Database, AlertCircle } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/shared/ui/card'
import { Button } from '@/components/shared/ui/button'
import { Textarea } from '@/components/shared/ui/textarea'
import { toast } from 'sonner'
import { Template, trpc } from '@/lib/trpc'

import { CriterionModal } from './criterion-modal'
import { CriterionInput } from '@btw-app/shared'

// 🔥 ЖЕСТКО ЗАДАННЫЕ СИСТЕМНЫЕ ПЕРЕМЕННЫЕ
const SYSTEM_TAGS = [
  { name: 'Imię ucznia', tag: '{STUDENT_NAME}' },
  { name: 'Początek okresu', tag: '{PERIOD_START}' },
  { name: 'Koniec okresu', tag: '{PERIOD_END}' },
  { name: 'Liczba obecności', tag: '{ATTENDANCE}' }
]

// ==========================================================
// 1. КОНТЕЙНЕР: Загружает данные и обрабатывает лоадер
// ==========================================================
export function TemplatesTab() {
  const { data: templateData, isLoading } = trpc.reports.getTemplate.useQuery()

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!templateData) return null

  // Рендерим форму, только когда шаблон точно загружен
  return <TemplatesForm templateData={templateData} />
}

// ==========================================================
// 2. ФОРМА: Управляет стейтом
// ==========================================================
function TemplatesForm({ templateData }: { templateData: Template }) {
  const trpcUtils = trpc.useUtils()
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Инициализируем стейт НАПРЯМУЮ из загруженных данных
  const [templateText, setTemplateText] = useState(templateData.body)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCriterion, setEditingCriterion] = useState<CriterionInput | null>(null)

  // --- ПРОВЕРКА НА ИЗМЕНЕНИЯ (isDirty) ---
  const isDirty = useMemo(() => {
    return templateText !== templateData.body
  }, [templateData.body, templateText])

  // --- МУТАЦИИ ---
  const updateTemplateBodyMut = trpc.reports.updateTemplateBody.useMutation({
    onSuccess: () => {
      toast.success('Szablon został zapisany!')
      trpcUtils.reports.getTemplate.invalidate()
    },
    onError: (err) => toast.error(`Błąd: ${err.message}`)
  })

  const upsertCriterionMut = trpc.reports.upsertCriterion.useMutation({
    onSuccess: () => {
      toast.success('Kryterium zapisane pomyślnie!')
      trpcUtils.reports.getTemplate.invalidate()
    },
    onError: (err) => toast.error(`Błąd: ${err.message}`)
  })

  const deleteCriterionMut = trpc.reports.deleteCriterion.useMutation({
    onSuccess: () => {
      toast.success('Kryterium zostało usunięte!')
      trpcUtils.reports.getTemplate.invalidate()
    },
    onError: (err) => toast.error(`Błąd: ${err.message}`)
  })

  // --- ОБРАБОТЧИКИ СОБЫТИЙ ---
  const handleSaveTemplateBody = () => {
    updateTemplateBodyMut.mutate({ body: templateText })
  }

  const handleSaveCriterion = (criterion: CriterionInput) => {
    upsertCriterionMut.mutate(criterion)
    setIsModalOpen(false)
  }

  const handleDeleteCriterion = (id: number) => {
    if (confirm('Czy na pewno chcesz usunąć to kryterium?')) {
      deleteCriterionMut.mutate({ id })
    }
  }

  const insertTag = (tag: string) => {
    const textarea = textareaRef.current
    if (textarea) {
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const newValue = templateText.slice(0, start) + tag + templateText.slice(end)
      setTemplateText(newValue)

      // Возвращаем фокус и курсор после вставки
      setTimeout(() => {
        textarea.focus()
        textarea.setSelectionRange(start + tag.length, start + tag.length)
      }, 0)
    } else {
      setTemplateText((prev) => prev + tag)
    }
  }

  // 🔥 Динамический рендер превью: подставляем фейковые данные для системных тегов
  const renderPreview = () => {
    let preview = templateText
    preview = preview.replace(/{STUDENT_NAME}/g, 'Jan Kowalski')
    preview = preview.replace(/{PERIOD_START}/g, '01.10.2023')
    preview = preview.replace(/{PERIOD_END}/g, '31.10.2023')
    preview = preview.replace(/{ATTENDANCE}/g, '8')

    // Заменяем оставшиеся кастомные теги на [Wartość]
    return preview.replace(/{[A-Z_]+}/g, '[Wartość]')
  }

  const criteria = templateData.criteria || []

  return (
    <div className="flex flex-col gap-6 h-full min-h-0">
      {/* Верхняя панель с кнопкой сохранения */}
      {isDirty && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-primary/5 p-4 rounded-xl border border-primary/20 animate-in fade-in slide-in-from-top-2 shrink-0 gap-4 shadow-sm">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-primary">Masz niezapisane zmiany</h3>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                Zapisanie szablonu wpłynie <strong>tylko na nowo wygenerowane cykle</strong>{' '}
                raportów. Istniejące raporty (nawet te ze statusem "Oczekujące") zachowają starą
                wersję szablonu, aby zapobiec utracie pracy nauczycieli.
              </p>
            </div>
          </div>
          <Button
            onClick={handleSaveTemplateBody}
            disabled={updateTemplateBodyMut.isLoading}
            className="rounded-xl shrink-0 sm:w-auto w-full shadow-sm"
          >
            {updateTemplateBodyMut.isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Zapisz szablon
          </Button>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3 flex-1 min-h-0 pb-6">
        {/* Left Column: Criteria List */}
        <Card className="rounded-xl border-border lg:col-span-1 flex flex-col h-full">
          <CardHeader className="shrink-0 pb-3">
            <CardTitle className="text-foreground">Zarządzanie Kryteriami</CardTitle>
            <CardDescription>Kliknij tag, aby wstawić zmienną do szablonu.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 flex-1 overflow-y-auto custom-scrollbar">
            {/* 🔥 СИСТЕМНЫЕ ТЕГИ */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-1.5">
                <Database className="h-3 w-3" /> Zmienne systemowe
              </h4>
              <div className="flex flex-col gap-1.5">
                {SYSTEM_TAGS.map((sys) => (
                  <Button
                    key={sys.tag}
                    variant="secondary"
                    size="sm"
                    onClick={() => insertTag(sys.tag)}
                    className="w-full justify-start rounded-lg text-xs font-medium bg-primary/5 text-primary hover:bg-primary/15 border border-primary/10"
                  >
                    <span className="truncate">{sys.name}</span>
                    <span className="ml-auto font-mono opacity-70">{sys.tag}</span>
                  </Button>
                ))}
              </div>
            </div>

            <div className="h-px bg-border/50" />

            {/* КАСТОМНЫЕ КРИТЕРИИ */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase text-muted-foreground">
                Kryteria nauczyciela
              </h4>
              <div className="flex flex-col gap-1.5">
                {criteria.map((criterion: CriterionInput) => (
                  <div key={criterion.id} className="flex items-center gap-1 group">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => insertTag(criterion.tag)}
                      className="flex-1 justify-start rounded-lg font-normal hover:bg-secondary text-xs"
                    >
                      <span className="text-foreground truncate">{criterion.name}</span>
                      <span className="ml-auto font-mono text-muted-foreground shrink-0">
                        {criterion.tag}
                      </span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setEditingCriterion(criterion)
                        setIsModalOpen(true)
                      }}
                      className="h-8 w-8 text-muted-foreground hover:text-foreground shrink-0"
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={deleteCriterionMut.isLoading}
                      onClick={() => criterion.id && handleDeleteCriterion(criterion.id)}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                    >
                      {deleteCriterionMut.isLoading ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Trash2 className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setEditingCriterion(null)
                  setIsModalOpen(true)
                }}
                className="w-full rounded-xl mt-2 border-dashed"
              >
                <Plus className="mr-2 h-3 w-3" />
                Dodaj nowe kryterium
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Right Column: Template Editor */}
        <Card className="rounded-xl border-border lg:col-span-2 flex flex-col h-full">
          <CardHeader className="shrink-0">
            <CardTitle className="text-foreground">Edytor Szablonu</CardTitle>
            <CardDescription>
              Użyj zmiennych z lewej strony, aby stworzyć spersonalizowaną wiadomość.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col gap-4 min-h-0">
            <Textarea
              ref={textareaRef}
              value={templateText}
              onChange={(e) => setTemplateText(e.target.value)}
              className="flex-1 min-h-[200px] font-sans text-sm leading-relaxed rounded-xl resize-none custom-scrollbar p-4 bg-background/50 focus:bg-background transition-colors border-border/60"
              placeholder="Wprowadź szablon raportu..."
            />

            {/* Live Preview */}
            <div className="rounded-xl border border-border bg-secondary/50 p-4 shrink-0 max-h-[40%] overflow-y-auto custom-scrollbar">
              <h4 className="text-sm font-medium text-muted-foreground mb-3">Podgląd na żywo</h4>
              <div className="whitespace-pre-wrap text-sm text-foreground bg-background rounded-xl p-4 border border-border shadow-inner">
                {renderPreview()}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <CriterionModal
        key={editingCriterion ? `edit-${editingCriterion.id}` : 'new'}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveCriterion}
        initialData={editingCriterion}
      />
    </div>
  )
}
