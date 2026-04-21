'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight, Check, XCircle, AlertTriangle } from 'lucide-react'
import { Badge } from '@/components/shared/ui/badge'
import { cn } from '@/lib/utils'
import type { TabType } from '@/components/pages/send-reports-page'
import { WorkspaceReport } from '@/lib/trpc'

interface StudentListProps {
  reports: WorkspaceReport[]
  selectedReportId: number | null
  onSelectReport: (report: WorkspaceReport) => void
  activeTab: TabType
  isReadOnly: boolean
}

const formatDate = (d: Date | string | null) => {
  if (!d) return ''
  return new Date(d).toLocaleDateString('pl-PL', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

export function StudentList({
  reports,
  selectedReportId,
  onSelectReport,
  activeTab,
  isReadOnly
}: StudentListProps) {
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())

  // Группируем по чистым данным
  const groupedReports = reports.reduce(
    (acc, report) => {
      const groupName = report.groupName || 'Indywidualne'
      if (!acc[groupName]) acc[groupName] = []
      acc[groupName].push(report)
      return acc
    },
    {} as Record<string, WorkspaceReport[]>
  )

  const toggleGroup = (group: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(group)) next.delete(group)
      else next.add(group)
      return next
    })
  }

  const getEmptyMessage = () => {
    const prefix = isReadOnly ? 'Brak archiwalnych ' : 'Brak '
    switch (activeTab) {
      case 'pending':
        return `${prefix}oczekujących raportów`
      case 'overdue':
        return `${prefix}opóźnionych raportów`
      case 'sent':
        return `${prefix}wysłanych raportów`
      case 'canceled':
        return `${prefix}odwołanych raportów`
      default:
        return 'Brak raportów'
    }
  }

  if (reports.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-6 text-center">
        <div className="bg-secondary/30 border border-border/50 rounded-2xl p-6 w-full flex flex-col items-center gap-3">
          <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
            <Check className="h-6 w-6 text-muted-foreground/50" />
          </div>
          <p className="text-muted-foreground font-medium">{getEmptyMessage()}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 p-3 overflow-y-auto custom-scrollbar h-full">
      {Object.entries(groupedReports).map(([group, groupReports]) => {
        const isCollapsed = collapsedGroups.has(group)

        return (
          <div key={group} className="flex flex-col gap-2">
            <button
              onClick={() => toggleGroup(group)}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm font-semibold text-secondary-foreground bg-secondary/40 rounded-xl transition-colors hover:bg-secondary/60 group-hover"
            >
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
              {group}
              <Badge
                variant="secondary"
                className="ml-auto bg-background/50 h-5 px-1.5 text-xs font-medium"
              >
                {groupReports.length}
              </Badge>
            </button>

            {!isCollapsed && (
              <div className="flex flex-col gap-1.5 pl-1">
                {groupReports.map((report) => {
                  const isSelected = selectedReportId === report.id
                  const isMissingTg =
                    !report.student.parentTgChatId &&
                    report.status !== 'SENT' &&
                    report.status !== 'CANCELED'
                  const initials = report.student.name.substring(0, 2).toUpperCase()

                  return (
                    <button
                      key={report.id}
                      onClick={() => onSelectReport(report)}
                      className={cn(
                        'flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all border',
                        isSelected
                          ? isMissingTg
                            ? 'bg-warning border-warning shadow-md text-warning-foreground'
                            : 'bg-primary text-primary-foreground border-primary shadow-md'
                          : 'bg-card border-transparent hover:border-primary/20 hover:bg-primary/5 hover:shadow-sm'
                      )}
                    >
                      <div
                        className={cn(
                          'flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold shrink-0 shadow-sm border transition-colors',
                          isSelected
                            ? 'bg-background/20 border-transparent'
                            : report.status === 'SENT'
                              ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                              : activeTab === 'overdue'
                                ? 'bg-red-100 text-red-700 border-red-200'
                                : report.status === 'CANCELED'
                                  ? 'bg-muted text-muted-foreground border-border'
                                  : isMissingTg
                                    ? 'bg-warning/20 text-warning-foreground border-warning/30'
                                    : 'bg-primary/10 text-primary border-primary/20'
                        )}
                      >
                        {report.status === 'SENT' ? (
                          <Check className="h-5 w-5" />
                        ) : report.status === 'CANCELED' ? (
                          <XCircle className="h-5 w-5" />
                        ) : isMissingTg && !isSelected ? (
                          <AlertTriangle className="h-5 w-5" />
                        ) : (
                          initials
                        )}
                      </div>

                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="text-sm font-semibold truncate mb-1">
                          {report.student.name}
                        </span>
                        {report.sentAt && (
                          <span
                            className={cn(
                              'text-xs truncate font-medium',
                              isSelected ? 'text-primary-foreground/80' : 'text-emerald-600/80'
                            )}
                          >
                            Wysłano: {formatDate(report.sentAt)}
                          </span>
                        )}
                        {report.canceledAt && (
                          <span
                            className={cn(
                              'text-xs truncate',
                              isSelected ? 'text-primary-foreground/70' : 'text-muted-foreground'
                            )}
                          >
                            Odwołano: {formatDate(report.canceledAt)}
                          </span>
                        )}
                        {isMissingTg && !isSelected && (
                          <span className="text-[10px] font-medium text-warning truncate">
                            Brak powiązanego Telegrama
                          </span>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
