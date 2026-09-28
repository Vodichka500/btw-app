import { useEffect, useMemo, useState } from 'react'
import { Send, Eye, X, Settings2, AlertTriangle, Loader2, Info, FileWarning } from 'lucide-react'
import { Button } from '@/components/shared/ui/button'
import { Textarea } from '@/components/shared/ui/textarea'
import { Badge } from '@/components/shared/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/shared/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/shared/ui/dialog'
import { cn } from '@/lib/utils'
import { TemplateSnapshotSchema } from '@btw-app/shared'
import { WorkspaceReport } from '@/lib/trpc'
import { useAuthStore } from '@/store/authStore'
import { loadReportDraft, saveReportDraft } from '@/lib/report-drafts'

interface ReportEditorProps {
  report: WorkspaceReport
  onSendReport: (reportId: number, generatedText: string) => void
  onCancelReport: (reportId: number, reason: string) => void
  isSending?: boolean
}

const formatDate = (d: Date | string | null) => {
  if (!d) return ''
  return new Date(d).toLocaleDateString('pl-PL', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric'
  })
}

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const hasValue = (value: string | undefined) => Boolean(value?.trim())

const applyCriteriaToTemplate = (
  template: string,
  criteria: Array<{ tag: string; name: string; required: boolean }>,
  values: Record<string, string>
) => {
  let result = template

  for (const criterion of criteria) {
    const value = values[criterion.tag] || ''
    const tagPattern = new RegExp(escapeRegExp(criterion.tag), 'g')

    if (!hasValue(value) && !criterion.required) {
      // Optional criteria are expected to occupy their own line in the template.
      // Removing that line prevents labels such as "Comment:" from leaking into Telegram.
      result = result
        .split(/\r?\n/)
        .filter((line) => !line.includes(criterion.tag))
        .join('\n')
        .replace(tagPattern, '')
      continue
    }

    result = result.replace(tagPattern, hasValue(value) ? value : `[Brak: ${criterion.name}]`)
  }

  return result.replace(/\n{3,}/g, '\n\n').trim()
}

export function ReportEditor({
  report,
  onSendReport,
  onCancelReport,
  isSending
}: ReportEditorProps) {
  // Local State
  const userId = useAuthStore((state) => state.user?.id)
  const initialTemplateId =
    report.templateSnapshot && typeof report.templateSnapshot === 'object'
      ? Number((report.templateSnapshot as { id?: number }).id ?? 0) || null
      : null
  const [criteria, setCriteria] = useState<Record<string, string>>(() =>
    loadReportDraft(userId, report.id, initialTemplateId)
  )
  const [cancelModalOpen, setCancelModalOpen] = useState(false)
  const [customReason, setCustomReason] = useState('')

  // Derived State
  const templateData = useMemo(() => {
    if (!report.templateSnapshot) return null
    try {
      return TemplateSnapshotSchema.parse(report.templateSnapshot)
    } catch (e) {
      console.error('Błąd parsowania szablonu z bazy danych:', e)
      return null
    }
  }, [report.templateSnapshot])

  useEffect(() => {
    saveReportDraft(userId, report.id, templateData?.id ?? null, criteria)
  }, [criteria, report.id, templateData?.id, userId])

  const generatedBaseText = useMemo(() => {
    if (!templateData || !templateData.body) return ''

    let text = templateData.body

    text = text.replace(/{STUDENT_NAME}/g, report.student.name)
    text = text.replace(/{PERIOD_START}/g, formatDate(report.cycle.periodStart))
    text = text.replace(/{PERIOD_END}/g, formatDate(report.cycle.periodEnd))
    text = text.replace(/{ATTENDANCE}/g, report.lessonsAttended.toString())
    text = text.replace(/{TEACHER}/g, report.teacher.name)
    text = text.replace(/{GROUP}/g, report?.groupName ?? 'Без названия')
    text = text.replace(/{SUBJECT}/g, report?.alfaSubject?.name ?? 'Без предмета')

    if (templateData.criteria) {
      text = applyCriteriaToTemplate(text, templateData.criteria, criteria)
    }

    return text.trim()
  }, [report, criteria, templateData])

  const isReadyToSend = useMemo(() => {
    if (!templateData?.criteria || templateData.criteria.length === 0) return true
    return templateData.criteria.every((crit) => !crit.required || hasValue(criteria[crit.tag]))
  }, [criteria, templateData])

  // Handlers & Callbacks
  const handleSend = () => {
    onSendReport(report.id, generatedBaseText)
  }

  const handleConfirmCancel = () => {
    if (!customReason.trim()) return
    onCancelReport(report.id, customReason.trim())
    setCancelModalOpen(false)
    setCustomReason('') // Сбрасываем после отправки
  }

  // Early returns
  if (!templateData || !templateData.body) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-card p-6 text-center animate-in fade-in zoom-in-95 duration-300">
        <div className="flex flex-col items-center gap-4 max-w-md bg-secondary/30 border border-border p-8 rounded-2xl shadow-sm">
          <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center">
            <FileWarning className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Brak szablonu raportu</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Administrator nie skonfigurował jeszcze głównego szablonu dla tego cyklu lub szablon
            jest uszkodzony. Nie możesz wygenerować raportu dla{' '}
            <strong>{report.student.name}</strong>.
          </p>
        </div>
      </div>
    )
  }

  // Main Return
  return (
    <>
      <div className="flex h-full flex-col bg-card animate-in fade-in duration-200">
        {/* --- ШАПКА --- */}
        <div className="flex flex-col gap-4 border-b border-border p-5 shrink-0 bg-background/50">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-foreground truncate">
                  {report.student.name}
                </h2>
                <Badge variant="secondary" className="bg-secondary/50 text-secondary-foreground">
                  {report.groupName || 'Indywidualne'}
                </Badge>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-muted-foreground">
                <Badge variant="outline" className="border-border bg-background">
                  {formatDate(report.cycle.periodStart)} - {formatDate(report.cycle.periodEnd)}
                </Badge>
                <span>•</span>
                <span className="text-foreground">{report.lessonsAttended} odbytych zajęć</span>
              </div>
            </div>

            {/* Выпадающее меню отмены */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-destructive shrink-0 rounded-xl"
                >
                  <X className="mr-2 h-4 w-4" /> Odwołaj raport
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="rounded-xl">
                <DropdownMenuItem
                  onClick={() => onCancelReport(report.id, 'tech_error')}
                  className="text-destructive cursor-pointer"
                >
                  <AlertTriangle className="mr-2 h-4 w-4" /> Błąd techniczny
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onCancelReport(report.id, 'no_lessons')}
                  className="cursor-pointer"
                >
                  <Eye className="mr-2 h-4 w-4" /> Nie było na zajęciach
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setCancelModalOpen(true)}
                  className="cursor-pointer"
                >
                  Inny powód...
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {report.sendError && (
            <div className="flex items-start gap-3 rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-destructive">
              <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
              <div className="flex flex-col gap-1 text-sm">
                <span className="font-bold">Błąd wysyłania</span>
                <span>{report.sendError}</span>
              </div>
            </div>
          )}
        </div>

        {/* --- ДВЕ КОЛОНКИ (Форма слева, Превью справа) --- */}
        <div className="flex flex-1 overflow-hidden flex-col lg:flex-row">
          {/* ЛЕВАЯ КОЛОНКА: КРИТЕРИИ И ДОП. ТЕКСТ */}
          <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
            <div className="flex flex-col gap-8 max-w-2xl mx-auto lg:mx-0">
              {/* 🔥 Блок с критериями: теперь универсальный маппинг options */}
              <div className="grid gap-6">
                {templateData.criteria.map((crit) => (
                  <div key={crit.id} className="flex flex-col gap-3">
                    <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                      <Settings2 className="h-4 w-4 text-primary" /> {crit.name}
                    </div>

                    {crit.type === 'TEXT' ? (
                      <Textarea
                        value={criteria[crit.tag] || ''}
                        onChange={(e) =>
                          setCriteria((current) => ({ ...current, [crit.tag]: e.target.value }))
                        }
                        placeholder={crit.required ? 'Wpisz odpowiedź...' : 'Opcjonalnie...'}
                        className="min-h-[100px] resize-y rounded-xl bg-background/50 text-sm leading-relaxed"
                      />
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {crit.options?.map((opt) => {
                          const isActive = criteria[crit.tag] === opt

                          // Универсальные стили для кастомных кнопок.
                          // Если нужна разная цветовая гамма, можно добавить логику здесь.
                          return (
                            <button
                              key={opt}
                              onClick={() => setCriteria((p) => ({ ...p, [crit.tag]: opt }))}
                              className={cn(
                                'rounded-xl border px-4 py-2 text-sm font-semibold transition-all',
                                isActive
                                  ? 'border-primary bg-primary text-primary-foreground shadow-md'
                                  : 'border-border bg-background text-muted-foreground hover:border-primary/40 hover:bg-primary/5'
                              )}
                            >
                              {opt}
                            </button>
                          )
                        })}
                        {!crit.required && hasValue(criteria[crit.tag]) && (
                          <button
                            type="button"
                            onClick={() =>
                              setCriteria((current) => ({ ...current, [crit.tag]: '' }))
                            }
                            className="rounded-xl border border-dashed border-border px-4 py-2 text-sm font-semibold text-muted-foreground hover:border-primary/40 hover:text-foreground"
                          >
                            Очистить
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

            </div>
          </div>

          {/* ПРАВАЯ КОЛОНКА: ЗАФИКСИРОВАННЫЙ ПРЕДПРОСМОТР */}
          <div className="w-full lg:w-[400px] xl:w-[450px] border-t lg:border-t-0 lg:border-l border-border bg-muted/10 flex flex-col shrink-0">
            <div className="p-4 border-b border-border flex items-center justify-between bg-card/50">
              <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                <Eye className="h-4 w-4 text-primary" /> Podgląd wiadomości
              </div>
              <span className="text-xs font-medium text-muted-foreground bg-secondary px-2 py-1 rounded-md flex items-center gap-1">
                <Info className="h-3 w-3" /> Telegram
              </span>
            </div>

          <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-4 custom-scrollbar">
              <div className="min-h-full rounded-xl border border-border/50 bg-background p-4 shadow-sm">
                <pre className="whitespace-pre-wrap break-words font-sans text-sm text-foreground leading-relaxed [overflow-wrap:anywhere]">
                  {generatedBaseText}
                </pre>
              </div>
            </div>
          </div>
        </div>

        {/* --- ФУТЕР --- */}
        <div className="border-t border-border p-5 bg-background/50 shrink-0 z-10">
          <Button
            onClick={handleSend}
            disabled={!isReadyToSend || isSending}
            size="lg"
            className="w-full rounded-xl font-bold shadow-sm transition-all"
          >
            {isSending ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Wysyłanie...
              </>
            ) : (
              <>
                <Send className="mr-2 h-5 w-5" /> Wyślij raport
              </>
            )}
          </Button>
          {!isReadyToSend && (
            <p className="mt-3 text-center text-xs font-medium text-muted-foreground">
              Wypełnij wszystkie kryteria, aby aktywować wysyłkę.
            </p>
          )}
        </div>
      </div>

      <Dialog open={cancelModalOpen} onOpenChange={setCancelModalOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Podaj powód odwołania</DialogTitle>
            <DialogDescription>
              Wpisz powód, dla którego odwołujesz ten raport. Będzie on widoczny w systemie dla
              administracji.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              placeholder="Np. Uczeń dołączył do grupy pod koniec cyklu..."
              className="resize-none rounded-xl bg-background/50 font-sans text-sm leading-relaxed border-border/60 focus:bg-background custom-scrollbar shadow-inner min-h-[100px]"
            />
          </div>
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setCancelModalOpen(false)}
              className="rounded-xl flex-1"
            >
              Anuluj
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmCancel}
              disabled={!customReason.trim()}
              className="rounded-xl flex-1"
            >
              Odwołaj raport
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
