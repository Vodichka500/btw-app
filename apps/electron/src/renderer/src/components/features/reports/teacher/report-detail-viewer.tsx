import { Check, XCircle, Calendar, User, Lock, RotateCcw, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/shared/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/shared/ui/alert-dialog'

import type { WorkspaceReport } from '@/lib/trpc'


// Helpers
const formatDate = (d: Date | string | null) => {
  if (!d) return ''
  return new Date(d).toLocaleDateString('pl-PL', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

interface ReportDetailViewerProps {
  report: WorkspaceReport
  isReadOnly?: boolean
  onRestoreReport?: (reportId: number) => void
}

export function ReportDetailViewer({
  report,
  isReadOnly = false,
  onRestoreReport
}: ReportDetailViewerProps) {
  const isCanceled = report.status === 'CANCELED'

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-start justify-between border-b border-border px-4 py-4 md:px-6 bg-card">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold text-foreground">{report.student.name}</h2>

            {/* Динамический бейджик статуса */}
            {isCanceled ? (
              <span className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                <XCircle className="h-3 w-3" /> Odwołany
              </span>
            ) : (
              <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 border border-emerald-200">
                <Check className="h-3 w-3" /> Wysłany
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{report.groupName || 'Indywidualne'}</p>
        </div>

        {/* Кнопка восстановления (только для отмененных и не в архиве) */}
        {isCanceled && !isReadOnly && onRestoreReport && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="text-primary border-primary hover:bg-primary/10 rounded-xl"
              >
                <RotateCcw className="mr-2 h-4 w-4" /> Przywróć raport
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="rounded-2xl">
              <AlertDialogHeader>
                <AlertDialogTitle>Przywrócić raport?</AlertDialogTitle>
                <AlertDialogDescription>
                  Raport dla ucznia {report.student.name} zostanie przeniesiony do zakładki
                  &quot;Oczekujące&quot;.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="rounded-xl">Anuluj</AlertDialogCancel>
                <AlertDialogAction
                  className="rounded-xl"
                  onClick={() => onRestoreReport(report.id)}
                >
                  Przywróć
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-background custom-scrollbar">
        <div className="flex flex-col gap-5 max-w-3xl">
          <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2 bg-secondary/50 px-3 py-1.5 rounded-lg border border-border">
              <Calendar className="h-4 w-4" />
              <span className="font-medium text-foreground">
                {isCanceled ? 'Odwołano:' : 'Wysłano:'}{' '}
                {isCanceled ? formatDate(report.canceledAt) : formatDate(report.sentAt)}
              </span>
            </div>
            <div className="flex items-center gap-2 bg-secondary/50 px-3 py-1.5 rounded-lg border border-border">
              <User className="h-4 w-4" />
              <span className="font-medium text-foreground">{report.lessonsAttended} zajęć</span>
            </div>
          </div>

          {/* Плашка с причиной отмены */}
          {isCanceled && (
            <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 flex items-start gap-3 animate-in fade-in zoom-in-95">
              <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div className="flex flex-col gap-1">
                <span className="text-sm font-semibold text-destructive">Powód odwołania</span>
                <span className="text-sm text-destructive/80">
                  {report.cancelReason === 'no_lessons'
                    ? 'Nie było na zajęciach'
                    : report.cancelReason === 'tech_error'
                      ? 'Błąd techniczny'
                      : report.cancelReason || 'Nie podano powodu'}
                </span>
              </div>
            </div>
          )}

          {/* Текст отчета (Показываем только если отправлен) */}
          {!isCanceled && (
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm animate-in fade-in slide-in-from-bottom-2">
              <pre className="whitespace-pre-wrap font-sans text-sm text-foreground leading-relaxed">
                {/* Реальный текст из базы данных */}
                {report.generatedText
                  ? `${report.generatedText}\n\n${report.additionalText}`
                  : 'Brak treści raportu w bazie danych.'}
              </pre>
            </div>
          )}

          {isReadOnly && (
            <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/50 p-4 mt-4 animate-in fade-in">
              <Lock className="h-5 w-5 text-muted-foreground shrink-0" />
              <p className="text-sm text-muted-foreground">
                Przeglądasz archiwalne dane. Raporty z poprzednich okresów nie mogą być edytowane.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
