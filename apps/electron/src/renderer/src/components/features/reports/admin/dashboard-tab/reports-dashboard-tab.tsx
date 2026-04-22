'use client'

import { useState, useMemo, useCallback } from 'react'
import { Loader2, Info } from 'lucide-react'
import { toast } from 'sonner'
import { trpc } from '@/lib/trpc'

import { Button } from '@/components/shared/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/shared/ui/dialog'

import { useUIStore } from '@/store/uiStore'
import { SendMessagesModal } from '../../../telegram/send-messages-modal'
import { ReminderTemplateEditor } from '../reminder-template-editor'

// Импортируем наши новые компоненты (пути подставь свои)
import { ReportsCycleHeader } from './reports-cycle-header'
import { ReportsStatsCards } from './reports-stats-cards'
import { ReportsTeacherTable } from './reports-teacher-table'

const formatDate = (d: string | Date) => {
  return new Date(d).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' })
}

export function ReportsDashboardTab() {
  // Context & Stores
  const trpcUtils = trpc.useUtils()
  const { setViewMode, setTargetTeacherIdForReports } = useUIStore()

  // Local State
  const [selectedCycleId, setSelectedCycleId] = useState<string | null>(null)
  const [selectedTeacherIds, setSelectedTeacherIds] = useState<number[]>([])
  const [isSendModalOpen, setIsSendModalOpen] = useState(false)
  const [sessionTemplate, setSessionTemplate] = useState<string | null>(null)
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false)
  const [tempTemplateValue, setTempTemplateValue] = useState('')

  // API Queries
  const { data: cycles, isLoading: cyclesLoading } = trpc.reports.getAdminCycles.useQuery()
  const { data: settings } = trpc.reports.getSettings.useQuery()

  const actualCycleId = selectedCycleId ?? (cycles?.[0]?.id.toString() || '')

  const {
    data: teachersStats,
    isLoading: statsLoading,
    isFetching: isStatsFetching
  } = trpc.reports.getCycleTeacherStats.useQuery(
    { cycleId: parseInt(actualCycleId) },
    { enabled: !!actualCycleId }
  )

  // API Mutations
  const refreshMut = trpc.reports.refreshCycle.useMutation({
    onSuccess: (res) => {
      toast.success(`${res.message}. Dodano nowych raportów: ${res.newReportsAdded}`)
      trpcUtils.reports.getAdminCycles.invalidate()
      trpcUtils.reports.getCycleTeacherStats.invalidate()
    }
  })

  const deleteMut = trpc.reports.deleteCycle.useMutation({
    onSuccess: () => {
      toast.success('Cykl został usunięty!')
      setSelectedCycleId(null)
      trpcUtils.reports.getAdminCycles.invalidate()
    }
  })

  const sendMessageMut = trpc.telegram.sendMessage.useMutation()

  // Derived State
  const activeCycle = useMemo(() => {
    return cycles?.find((c) => c.id.toString() === actualCycleId)
  }, [cycles, actualCycleId])

  const currentTemplate = sessionTemplate ?? settings?.defaultReminderText ?? ''

  const formattedTeachersForModal = useMemo(() => {
    if (!teachersStats) return []
    return teachersStats
      .filter((t) => selectedTeacherIds.includes(t.teacherId))
      .map((t) => ({
        id: t.teacherId,
        name: t.teacherName,
        tgChatId: t.tgChatId,
        pendingCount: t.pending,
        totalCount: t.total
      }))
  }, [teachersStats, selectedTeacherIds])

  const pendingReports = activeCycle?.stats.pending || 0
  const sentReports = activeCycle?.stats.sent || 0
  const issueReports = (activeCycle?.stats.failed || 0) + (activeCycle?.stats.canceled || 0)
  const hasMissingData =
    activeCycle &&
    (activeCycle.missingTeachers.length > 0 || activeCycle.missingCustomers.length > 0)

  // Handlers & Callbacks
  const handleOpenTemplateEditor = () => {
    setTempTemplateValue(currentTemplate)
    setIsTemplateModalOpen(true)
  }

  const handleSaveSessionTemplate = () => {
    setSessionTemplate(tempTemplateValue)
    setIsTemplateModalOpen(false)
  }

  const renderLivePreview = () => {
    const template = tempTemplateValue || ''
    if (!template) return 'Brak tekstu.'

    const sampleTeacher =
      teachersStats?.find((t) => selectedTeacherIds.includes(t.teacherId)) || teachersStats?.[0]

    const deadlineDate = new Date(activeCycle?.createdAt || Date.now())
    if (settings?.deadlineDays) deadlineDate.setDate(deadlineDate.getDate() + settings.deadlineDays)

    const cycleName =
      activeCycle?.label ||
      (activeCycle
        ? `${formatDate(activeCycle.periodStart)} - ${formatDate(activeCycle.periodEnd)}`
        : 'Grupy B2')

    let preview = template
    preview = preview.replace(/{TEACHER_NAME}/g, sampleTeacher?.teacherName || 'Jan')
    preview = preview.replace(/{CYCLE_NAME}/g, cycleName)
    preview = preview.replace(
      /{PERIOD_START}/g,
      activeCycle ? formatDate(activeCycle.periodStart) : '01.10.2023'
    )
    preview = preview.replace(
      /{PERIOD_END}/g,
      activeCycle ? formatDate(activeCycle.periodEnd) : '31.10.2023'
    )
    preview = preview.replace(/{PENDING_COUNT}/g, (sampleTeacher?.pending || 5).toString())
    preview = preview.replace(/{TOTAL_COUNT}/g, (sampleTeacher?.total || 12).toString())
    preview = preview.replace(/{DEADLINE}/g, formatDate(deadlineDate))

    return preview
  }

  const handleToggleSelect = useCallback((teacherId: number) => {
    setSelectedTeacherIds((prev) =>
      prev.includes(teacherId) ? prev.filter((id) => id !== teacherId) : [...prev, teacherId]
    )
  }, [])

  const handleSelectAllDebtors = useCallback(() => {
    if (!teachersStats) return
    const debtors = teachersStats.filter((t) => t.pending > 0).map((t) => t.teacherId)
    setSelectedTeacherIds(selectedTeacherIds.length === debtors.length ? [] : debtors)
  }, [teachersStats, selectedTeacherIds])

  const handleTeacherClick = useCallback(
    (teacherInternalId: string) => {
      setTargetTeacherIdForReports(teacherInternalId)
      setViewMode('sendReports')
    },
    [setTargetTeacherIdForReports, setViewMode]
  )

  const handleProcessMessage = async (item) => {
    if (!activeCycle || !settings) throw new Error('Brak danych cyklu lub ustawień')

    const deadlineDate = new Date(activeCycle.createdAt)
    deadlineDate.setDate(deadlineDate.getDate() + settings.deadlineDays)
    const cycleName =
      activeCycle.label ||
      `${formatDate(activeCycle.periodStart)} - ${formatDate(activeCycle.periodEnd)}`

    let msg = currentTemplate
    msg = msg.replace(/{TEACHER_NAME}/g, item.name)
    msg = msg.replace(/{CYCLE_NAME}/g, cycleName)
    msg = msg.replace(/{PERIOD_START}/g, formatDate(activeCycle.periodStart))
    msg = msg.replace(/{PERIOD_END}/g, formatDate(activeCycle.periodEnd))
    msg = msg.replace(/{PENDING_COUNT}/g, item.pendingCount.toString())
    msg = msg.replace(/{TOTAL_COUNT}/g, item.totalCount.toString())
    msg = msg.replace(/{DEADLINE}/g, formatDate(deadlineDate))

    await sendMessageMut.mutateAsync({
      chatId: item.tgChatId,
      text: msg
    })
  }

  // Early returns
  if (cyclesLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!cycles || cycles.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center border-2 border-dashed border-border rounded-xl">
        <Info className="h-8 w-8 text-muted-foreground mb-2" />
        <p className="text-muted-foreground font-medium">Brak wygenerowanych cykli.</p>
      </div>
    )
  }

  // Main Return
  return (
    <div className="space-y-6 max-w-6xl">
      <ReportsCycleHeader
        cycles={cycles}
        actualCycleId={actualCycleId}
        activeCycle={activeCycle}
        onCycleChange={setSelectedCycleId}
        onRefresh={() =>
          refreshMut.mutate({
            cycleId: activeCycle!.id,
            alfaTempToken: 'mock',
            lessonType: 'ALL'
          })
        }
        onDelete={() => deleteMut.mutate({ id: activeCycle!.id })}
        isRefreshing={refreshMut.isLoading}
        isDeleting={deleteMut.isLoading}
        isStatsFetching={isStatsFetching}
        hasMissingData={hasMissingData}
      />

      <ReportsStatsCards
        pendingReports={pendingReports}
        sentReports={sentReports}
        issueReports={issueReports}
      />

      <ReportsTeacherTable
        teachersStats={teachersStats}
        statsLoading={statsLoading}
        selectedTeacherIds={selectedTeacherIds}
        onSelectAll={handleSelectAllDebtors}
        onToggleSelect={handleToggleSelect}
        onTeacherClick={handleTeacherClick}
        onOpenTemplateEditor={handleOpenTemplateEditor}
        onOpenSendModal={() => setIsSendModalOpen(true)}
      />

      {/* Модалки остаются в корневом компоненте, так как они завязаны на стейт и мутации */}
      <Dialog open={isTemplateModalOpen} onOpenChange={setIsTemplateModalOpen}>
        <DialogContent className="sm:max-w-[800px] rounded-2xl">
          <DialogHeader>
            <DialogTitle>Edytuj treść przypomnienia</DialogTitle>
            <DialogDescription>
              Zmodyfikuj treść wiadomości przed wysłaniem. Zmiany dotyczyć będą{' '}
              <b>tylko tej konkretnej wysyłki</b> i nie nadpiszą globalnego szablonu.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <ReminderTemplateEditor
              value={tempTemplateValue}
              onChange={setTempTemplateValue}
              renderPreview={renderLivePreview}
            />
          </div>
          <DialogFooter className="mt-2">
            <Button
              variant="outline"
              onClick={() => setIsTemplateModalOpen(false)}
              className="rounded-xl"
            >
              Anuluj
            </Button>
            <Button onClick={handleSaveSessionTemplate} className="rounded-xl">
              Zapisz zmienioną treść
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <SendMessagesModal
        isOpen={isSendModalOpen}
        onOpenChange={setIsSendModalOpen}
        items={formattedTeachersForModal}
        availableAudiences={['TEACHER']}
        requireMessageBody={false}
        getContactId={(item) => item.tgChatId}
        onProcessItem={handleProcessMessage}
        onComplete={() => setSelectedTeacherIds([])}
      />
    </div>
  )
}
