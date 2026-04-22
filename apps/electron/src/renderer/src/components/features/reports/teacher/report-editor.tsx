import { useMemo, useState } from 'react'
import { Send, Eye, X, Settings2, AlertTriangle, Loader2, Info, FileWarning } from 'lucide-react'
import { Button } from '@/components/shared/ui/button'
import { Textarea } from '@/components/shared/ui/textarea'
import { Input } from '@/components/shared/ui/input'
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

interface ReportEditorProps {
  report: WorkspaceReport
  onSendReport: (reportId: number, generatedText: string, additionalText?: string) => void
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

export function ReportEditor({
  report,
  onSendReport,
  onCancelReport,
  isSending
}: ReportEditorProps) {
  // Local State
  const [criteria, setCriteria] = useState<Record<string, string | number | null>>({})
  const [additionalText, setAdditionalText] = useState('')
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

  const generatedBaseText = useMemo(() => {
    if (!templateData || !templateData.body) return ''

    let text = templateData.body

    text = text.replace(/{STUDENT_NAME}/g, report.student.name)
    text = text.replace(/{PERIOD_START}/g, formatDate(report.cycle.periodStart))
    text = text.replace(/{PERIOD_END}/g, formatDate(report.cycle.periodEnd))
    text = text.replace(/{ATTENDANCE}/g, report.lessonsAttended.toString())

    if (templateData.criteria) {
      templateData.criteria.forEach((crit) => {
        const val = criteria[crit.tag]
        text = text.replace(new RegExp(crit.tag, 'g'), val ? String(val) : `[Brak: ${crit.name}]`)
      })
    }

    return text
  }, [report, criteria, templateData])

  const fullReportText = additionalText
    ? `${generatedBaseText}\n${additionalText}`
    : generatedBaseText

  const isReadyToSend = useMemo(() => {
    if (!templateData?.criteria || templateData.criteria.length === 0) return true
    return templateData.criteria.every(
      (crit) =>
        criteria[crit.tag] !== undefined && criteria[crit.tag] !== null && criteria[crit.tag] !== ''
    )
  }, [criteria, templateData])

  // Handlers & Callbacks
  const handleSend = () => {
    onSendReport(report.id, fullReportText, additionalText)
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
              {/* Блок с критериями */}
              <div className="grid gap-6">
                {templateData.criteria.map((crit) => (
                  <div key={crit.id} className="flex flex-col gap-3">
                    <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                      <Settings2 className="h-4 w-4 text-primary" /> {crit.name}
                    </div>

                    {crit.type === 'SCALE' && (
                      <div className="flex flex-wrap gap-2">
                        {([1, 2, 3, 4, 5] as const).map((rating) => {
                          let activeClasses = ''
                          let hoverClasses = ''

                          if (rating >= 4) {
                            activeClasses = 'border-emerald-500 bg-emerald-500 text-white shadow-md'
                            hoverClasses = 'hover:border-emerald-200 hover:bg-emerald-50'
                          } else if (rating === 3) {
                            activeClasses = 'border-amber-500 bg-amber-500 text-white shadow-md'
                            hoverClasses = 'hover:border-amber-200 hover:bg-amber-50'
                          } else {
                            activeClasses = 'border-rose-500 bg-rose-500 text-white shadow-md'
                            hoverClasses = 'hover:border-rose-200 hover:bg-rose-50'
                          }

                          const isActive = criteria[crit.tag] === rating

                          return (
                            <button
                              key={rating}
                              onClick={() => setCriteria((p) => ({ ...p, [crit.tag]: rating }))}
                              className={cn(
                                'flex items-center gap-1.5 rounded-xl border px-4 py-2 text-sm font-semibold transition-all',
                                isActive
                                  ? activeClasses
                                  : `border-border bg-background text-muted-foreground ${hoverClasses}`
                              )}
                            >
                              {rating}
                            </button>
                          )
                        })}
                      </div>
                    )}

                    {crit.type === 'YES_NO' && (
                      <div className="flex flex-wrap gap-2">
                        {[
                          {
                            val: 'Tak',
                            active: 'border-emerald-500 bg-emerald-500 text-white shadow-md',
                            hover: 'hover:border-emerald-200 hover:bg-emerald-50'
                          },
                          {
                            val: 'Nie',
                            active: 'border-rose-500 bg-rose-500 text-white shadow-md',
                            hover: 'hover:border-rose-200 hover:bg-rose-50'
                          }
                        ].map((opt) => {
                          const isActive = criteria[crit.tag] === opt.val
                          return (
                            <button
                              key={opt.val}
                              onClick={() => setCriteria((p) => ({ ...p, [crit.tag]: opt.val }))}
                              className={cn(
                                'rounded-xl border px-6 py-2 text-sm font-semibold transition-all',
                                isActive
                                  ? opt.active
                                  : `border-border bg-background text-muted-foreground ${opt.hover}`
                              )}
                            >
                              {opt.val}
                            </button>
                          )
                        })}
                      </div>
                    )}

                    {crit.type === 'TEXT' && (
                      <Input
                        value={(criteria[crit.tag] as string) || ''}
                        onChange={(e) => setCriteria((p) => ({ ...p, [crit.tag]: e.target.value }))}
                        placeholder={`Wpisz ${crit.name.toLowerCase()}...`}
                        className="rounded-xl border-border/60 bg-background/50 focus-visible:bg-background"
                      />
                    )}
                  </div>
                ))}
              </div>

              {/* Дополнительный текст */}
              <div className="flex flex-col gap-3 mt-2 pt-6 border-t border-border/50">
                <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                  <Settings2 className="h-4 w-4 text-primary" /> Dodatkowe uwagi (opcjonalnie)
                </div>
                <Textarea
                  value={additionalText}
                  onChange={(e) => setAdditionalText(e.target.value)}
                  placeholder="Możesz tu wpisać własne, dodatkowe uwagi dla rodzica..."
                  className="min-h-[120px] resize-none rounded-xl bg-background/50 font-sans text-sm leading-relaxed border-border/60 focus:bg-background custom-scrollbar shadow-inner"
                />
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

            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              <div className="rounded-xl border border-border/50 bg-background p-4 shadow-sm h-full">
                <pre className="whitespace-pre-wrap font-sans text-sm text-foreground leading-relaxed">
                  {fullReportText}
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

      {/* 🔥 МОДАЛКА ВВОДА ПРИЧИНЫ ОТМЕНЫ */}
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
