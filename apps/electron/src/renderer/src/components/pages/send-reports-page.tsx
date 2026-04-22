import { useState, useEffect, useMemo } from 'react'
import { Calendar, Lock, Loader2, User, MessageSquarePlus } from 'lucide-react'
import { toast } from 'sonner'
import { trpc, WorkspaceReport } from '@/lib/trpc'
import { Badge } from '@/components/shared/ui/badge'
import { Progress } from '@/components/shared/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/shared/ui/select'
import { StudentList } from '@/components/features/reports/teacher/student-list'
import { ReportEditor } from '@/components/features/reports/teacher/report-editor'
import { ReportDetailViewer } from '@/components/features/reports/teacher/report-detail-viewer'
import { EmptyDetail } from '@/components/features/reports/teacher/empty-detail'
import { useAuthStore } from '@/store/authStore'
import { useUIStore } from '@/store/uiStore'
import { Button } from '../shared/ui/button'
import { SendExtraReportModal } from '@/components/features/reports/teacher/send-extra-report-modal'

export type TabType = 'pending' | 'overdue' | 'sent' | 'canceled' | 'failed'

// HELPER FUNCTIONS
const formatDate = (d: Date | string | null) => {
  if (!d) return ''
  return new Date(d).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' })
}

const getUiStatus = (report: WorkspaceReport, currentTime: number): TabType => {
  if (report.status === 'SENT') return 'sent'
  if (report.status === 'CANCELED') return 'canceled'
  if (report.status === 'FAILED') return 'failed'
  if (
    report.status === 'PENDING' &&
    new Date(report.cycle.periodEnd).getTime() < currentTime - 3 * 86400000
  ) {
    return 'overdue'
  }
  return 'pending'
}

const EMPTY_REPORTS: WorkspaceReport[] = []


// MAIN COMPONENT
export function SendReportsPage() {
  // Context & Stores
  const { user } = useAuthStore()
  const targetTeacherIdForReports = useUIStore((s) => s.targetTeacherIdForReports)
  const setTargetTeacherIdForReports = useUIStore((s) => s.setTargetTeacherIdForReports)
  const trpcUtils = trpc.useUtils()

  // Local State
  const [currentTime] = useState(() => Date.now())
  const [activeTab, setActiveTab] = useState<TabType>('pending')
  const [selectedReportId, setSelectedReportId] = useState<number | null>(null)
  const [selectedPeriodId, setSelectedPeriodId] = useState<string | null>(null)
  const [isExtraModalOpen, setIsExtraModalOpen] = useState(false)
  const [selectedTargetTeacher, setSelectedTargetTeacher] = useState<string | 'ME'>('ME')

  // API Queries (Base)
  const isAdminOrManager = user?.role === 'ADMIN' || user?.role === 'MANAGER'

  const { data: teachersList } = trpc.teachers.getAll.useQuery(undefined, {
    enabled: isAdminOrManager
  })

  const { data: cyclesData, isLoading: cyclesLoading } = trpc.reports.getReportCycles.useQuery()

  // Derived State (Level 1: Configuration for main query)
  // Мы перенесли вычисление периода ВЫШЕ второго запроса, чтобы использовать его ID напрямую
  const periods = useMemo(() => {
    if (!cyclesData) return []
    return cyclesData.map((c) => ({
      id: c.id.toString(),
      dateLabel: `${formatDate(c.periodStart)} - ${formatDate(c.periodEnd)}`,
      nameLabel: c.label,
      isCurrent: !c.isArchived
    }))
  }, [cyclesData])

  const activePeriodId =
    selectedPeriodId || (periods.length > 0 ? periods[periods.length - 1].id : null)
  const activePeriod = periods.find((p) => p.id === activePeriodId)
  const isReadOnly = activePeriod ? !activePeriod.isCurrent : false

  const targetTeacherId = useMemo(() => {
    if (
      selectedTargetTeacher === 'ME' &&
      isAdminOrManager &&
      teachersList &&
      teachersList.length > 0 &&
      !user?.teacherId
    ) {
      return teachersList[0].id.toString()
    }
    return selectedTargetTeacher
  }, [selectedTargetTeacher, isAdminOrManager, teachersList, user?.teacherId])

  // API Queries (Main)
  // Теперь запрос выглядит чисто и логично, без дублирования тернарников
  const { data: reportsDataActual } = trpc.reports.getWorkspaceReports.useQuery(
    {
      cycleId: parseInt(activePeriodId || '0'),
      targetTeacherId: targetTeacherId !== 'ME' ? parseInt(targetTeacherId) : undefined
    },
    { enabled: !!activePeriodId }
  )

  // API Mutations
  const sendMut = trpc.reports.sendReport.useMutation({
    onSuccess: (res) => {
      if (res.status === 'FAILED') {
        toast.error('Błąd wysyłania: ' + (res.sendError || 'Nieznany błąd'))
        setActiveTab('failed')
        setSelectedReportId(res.id)
      } else {
        toast.success('Raport został przetworzony!')
        const currentIndex = filteredReports.findIndex((r) => r.id === res.id)
        const nextReport =
          filteredReports.find((_r, idx) => idx > currentIndex) ||
          filteredReports.find((_r, idx) => idx < currentIndex)
        if (nextReport) setSelectedReportId(nextReport.id)
        else setActiveTab('sent')
      }
      trpcUtils.reports.getWorkspaceReports.invalidate()
    },
    onError: (e) => toast.error(`Błąd: ${e.message}`)
  })

  const cancelMut = trpc.reports.cancelReport.useMutation({
    onSuccess: () => {
      toast.success('Raport odwołany')
      trpcUtils.reports.getWorkspaceReports.invalidate()
    },
    onError: (e) => toast.error(`Błąd: ${e.message}`)
  })

  const restoreMut = trpc.reports.restoreReport.useMutation({
    onSuccess: () => {
      toast.success('Raport przywrócony')
      trpcUtils.reports.getWorkspaceReports.invalidate()
    },
    onError: (e) => toast.error(`Błąd: ${e.message}`)
  })

  const rawReports = reportsDataActual || EMPTY_REPORTS

  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const filteredReports = useMemo(() => {
    if (
      isReadOnly &&
      (activeTab === 'pending' || activeTab === 'overdue' || activeTab === 'failed')
    ) {
      return EMPTY_REPORTS
    }
    return rawReports.filter((r) => getUiStatus(r, currentTime) === activeTab)
  }, [rawReports, activeTab, isReadOnly, currentTime])

  const counts = useMemo(() => {
    return {
      pending: rawReports.filter((r) => getUiStatus(r, currentTime) === 'pending').length,
      overdue: rawReports.filter((r) => getUiStatus(r, currentTime) === 'overdue').length,
      sent: rawReports.filter((r) => getUiStatus(r, currentTime) === 'sent').length,
      canceled: rawReports.filter((r) => getUiStatus(r, currentTime) === 'canceled').length,
      failed: rawReports.filter((r) => getUiStatus(r, currentTime) === 'failed').length,
      total: rawReports.length
    }
  }, [rawReports, currentTime])

  const actualSelectedReport = useMemo(() => {
    if (selectedReportId) {
      const found = filteredReports.find((r) => r.id === selectedReportId)
      if (found) return found
    }
    return filteredReports.length > 0 ? filteredReports[0] : null
  }, [filteredReports, selectedReportId])

  const tabs = [
    {
      id: 'pending' as TabType,
      label: 'Oczekujące',
      count: counts.pending,
      color: 'bg-amber-500',
      showInReadOnly: false
    },
    {
      id: 'overdue' as TabType,
      label: 'Opóźnione',
      count: counts.overdue,
      color: 'bg-destructive',
      showInReadOnly: false
    },
    {
      id: 'failed' as TabType,
      label: 'Błędy wysyłki',
      count: counts.failed,
      color: 'bg-rose-500',
      showInReadOnly: true
    },
    {
      id: 'sent' as TabType,
      label: 'Wysłane',
      count: counts.sent,
      color: 'bg-primary',
      showInReadOnly: true
    },
    {
      id: 'canceled' as TabType,
      label: 'Odwołane',
      count: counts.canceled,
      color: 'bg-muted-foreground',
      showInReadOnly: true
    }
  ]

  const visibleTabs = isReadOnly ? tabs.filter((t) => t.showInReadOnly) : tabs
  const progressPercent = counts.total > 0 ? (counts.sent / counts.total) * 100 : 0
  const isImpersonating = targetTeacherId !== 'ME'
  const targetTeacherName = isImpersonating
    ? teachersList?.find((t) => t.id.toString() === targetTeacherId)?.name
    : null

  // Handlers & Callbacks
  const handlePeriodChange = (periodId: string) => {
    setSelectedPeriodId(periodId)
    const period = periods.find((p) => p.id === periodId)
    if (
      period &&
      !period.isCurrent &&
      (activeTab === 'pending' || activeTab === 'overdue' || activeTab === 'failed')
    ) {
      setActiveTab('sent')
    }
  }

  const handleTeacherChange = (teacherId: string) => {
    setSelectedTargetTeacher(teacherId)
    setSelectedReportId(null)
    setActiveTab('pending')
  }

  const handleSendReport = (reportId: number, generatedText: string, additionalText?: string) => {
    sendMut.mutate({
      reportId,
      generatedText,
      additionalText: additionalText || null
    })
  }

  const handleCancelReport = (reportId: number, reason: string) => {
    const currentIndex = filteredReports.findIndex((r) => r.id === reportId)
    const nextReport =
      filteredReports.find((_r, idx) => idx > currentIndex) ||
      filteredReports.find((_r, idx) => idx < currentIndex)

    if (nextReport) setSelectedReportId(nextReport.id)
    else setActiveTab('canceled')

    cancelMut.mutate({ reportId, reason })
  }

  const handleRestoreReport = (reportId: number) => {
    setActiveTab('pending')
    setSelectedReportId(reportId)
    restoreMut.mutate({ reportId })
  }

  const renderDetailView = () => {
    if (!actualSelectedReport) return <EmptyDetail isReadOnly={isReadOnly} />

    const uiStatus = getUiStatus(actualSelectedReport, currentTime)

    switch (uiStatus) {
      case 'sent':
      case 'canceled':
        return (
          <ReportDetailViewer
            key={actualSelectedReport.id}
            report={actualSelectedReport}
            isReadOnly={isReadOnly}
            onRestoreReport={handleRestoreReport}
          />
        )
      case 'failed':
      case 'pending':
      case 'overdue':
        return (
          <ReportEditor
            key={actualSelectedReport.id}
            report={actualSelectedReport}
            onSendReport={handleSendReport}
            onCancelReport={handleCancelReport}
            isSending={sendMut.isLoading}
          />
        )
      default:
        return <EmptyDetail isReadOnly={isReadOnly} />
    }
  }

  // Lifecycle Effects
  useEffect(() => {
    if (targetTeacherIdForReports && isAdminOrManager) {
      setSelectedTargetTeacher(targetTeacherIdForReports)
      setTargetTeacherIdForReports(null)
    }
  }, [targetTeacherIdForReports, isAdminOrManager, setTargetTeacherIdForReports])

  // Early returns
  if (cyclesLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground font-medium">Ładowanie cykli...</p>
        </div>
      </div>
    )
  }

  if (periods.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground font-medium">Brak wygenerowanych cykli raportów.</p>
      </div>
    )
  }

  // Main Return
  return (
    <div className="flex h-screen flex-col bg-background">
      {/* HEADER */}
      <header className="border-b border-border bg-card px-4 py-4 md:px-6 shrink-0">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-semibold text-foreground md:text-xl">
                  {isImpersonating ? `Raporty: ${targetTeacherName}` : 'Cześć, Nauczycielu!'}
                </h1>
                {isReadOnly && (
                  <Badge
                    variant="secondary"
                    className="flex items-center gap-1 bg-muted text-muted-foreground"
                  >
                    <Lock className="h-3 w-3" /> Tylko podgląd
                  </Badge>
                )}
                {isImpersonating && (
                  <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30">
                    Tryb administratora
                  </Badge>
                )}
              </div>
              <span className="text-sm text-muted-foreground">
                {isReadOnly
                  ? `Przeglądasz archiwalne raporty z okresu ${activePeriod?.nameLabel}`
                  : `Masz ${counts.total} raportów w tym cyklu.`}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {isAdminOrManager && teachersList && teachersList.length > 0 && (
                <div className="flex items-center gap-2 mr-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <Select value={targetTeacherId} onValueChange={handleTeacherChange}>
                    <SelectTrigger className="w-[180px] md:w-[220px] rounded-xl bg-card border-dashed border-primary/40">
                      <SelectValue placeholder="Wybierz nauczyciela" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ME" className="font-semibold text-primary">
                        Moje raporty
                      </SelectItem>
                      {teachersList.map((t) => (
                        <SelectItem key={t.id} value={t.id.toString()}>
                          {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <Calendar className="h-4 w-4 text-muted-foreground" />
              <Select value={activePeriod?.id} onValueChange={handlePeriodChange}>
                <SelectTrigger className="w-[200px] md:w-[240px] rounded-xl">
                  <SelectValue placeholder="Wybierz okres" />
                </SelectTrigger>
                <SelectContent>
                  {periods.map((period) => (
                    <SelectItem key={period.id} value={period.id}>
                      <div className="flex flex-col text-left py-0.5">
                        {period.nameLabel && (
                          <span className="text-xs font-bold text-primary mb-0.5">
                            {period.nameLabel}
                          </span>
                        )}
                        <div className="flex items-center gap-2">
                          <span>{period.dateLabel}</span>
                          {period.isCurrent && (
                            <Badge
                              variant="secondary"
                              className="bg-primary/10 text-primary text-[10px]"
                            >
                              Aktualny
                            </Badge>
                          )}
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            {!isReadOnly && (
              <div className="flex items-center gap-3">
                <Progress value={progressPercent} className="h-2 w-36 md:w-48 [&>div]:bg-primary" />
                <span className="text-sm text-muted-foreground">
                  {counts.sent}/{counts.total} wysłano
                </span>
              </div>
            )}
            <div className="flex items-center gap-4 ml-auto">
              <nav
                className={`flex gap-1 rounded-xl bg-secondary/50 p-1 overflow-x-auto ${isReadOnly ? 'lg:ml-0' : ''}`}
              >
                {visibleTabs.map((tab) =>
                  tab.count > 0 || ['pending', 'sent', 'overdue'].includes(tab.id) ? (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors whitespace-nowrap md:px-4 ${
                        activeTab === tab.id
                          ? 'bg-background text-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <span className={`h-2 w-2 rounded-full ${tab.color}`} />
                      {tab.label}
                      <Badge
                        variant="secondary"
                        className={`ml-1 h-5 px-1.5 ${activeTab === tab.id ? 'bg-primary/10 text-primary' : 'bg-secondary'}`}
                      >
                        {tab.count}
                      </Badge>
                    </button>
                  ) : null
                )}
              </nav>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsExtraModalOpen(true)}
                className="hidden md:flex rounded-xl bg-primary/5 text-primary border-primary/20 hover:bg-primary/10"
              >
                <MessageSquarePlus className="w-4 h-4 mr-2" />
                Szybka wiadomość
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* BODY */}
      <div className="flex flex-1 overflow-hidden min-h-0">
        <aside className="w-72 shrink-0 border-r border-border bg-card md:w-80 flex flex-col min-h-0">
          <StudentList
            reports={filteredReports}
            selectedReportId={actualSelectedReport?.id ?? null}
            onSelectReport={(r) => setSelectedReportId(r.id)}
            activeTab={activeTab}
            isReadOnly={isReadOnly}
          />
        </aside>

        <main className="flex-1 bg-background flex flex-col min-h-0">{renderDetailView()}</main>
      </div>

      <SendExtraReportModal isOpen={isExtraModalOpen} onClose={() => setIsExtraModalOpen(false)} />
    </div>
  )
}
