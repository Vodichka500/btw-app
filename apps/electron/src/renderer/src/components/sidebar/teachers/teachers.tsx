import { ReactNode, useEffect, useState } from 'react'
import { useUIStore } from '@/store/uiStore'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
  ChevronDown,
  ChevronUp,
  CalendarDays,
  RefreshCw,
  Folder,
  User,
  Plus,
  ChevronRight,
  MoreHorizontal
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AsyncView } from '@/components/async-view'

// 🔥 Новые импорты
import { authClient } from '@/lib/auth-client'
import { useAlfaApi } from '@/hooks/use-alfa-api'
import { useAlfaCrm } from '@/hooks/use-alfa-crm'
import { useScheduleStore } from '@/hooks/use-schedule-store'
import { SubjectModal } from '@/components/sidebar/teachers/subject-modal'

export const Teachers = (): ReactNode => {
  const { isCollapsed, toggleCollapse, setViewMode, isTeachersOpen, setTeachersOpen } = useUIStore()

  // 1. Проверяем доступы в сессии
  const { data: session } = authClient.useSession()
  const hasAlfaCredentials = !!(session?.user?.alfaEmail && session?.user?.alfaToken)

  // 2. Достаем хуки AlfaCRM (только для синхронизации и проверки токена)
  const { getValidToken } = useAlfaApi()
  const { isUpdating, updateTeachers } = useAlfaCrm()
  const [isAlfaReady, setIsAlfaReady] = useState(false)

  // 3. Достаем реактивные данные из нашего нового tRPC стора
  const {
    loading,
    error,
    subjects,
    unassignedTeachers,
    createSubject,
    updateSubject,
    deleteSubject
  } = useScheduleStore()

  // 4. Проверяем валидность токена при наличии ключей
  useEffect(() => {
    if (hasAlfaCredentials) {
      getValidToken().then((token) => setIsAlfaReady(!!token))
    } else {
      setIsAlfaReady(false)
    }
  }, [hasAlfaCredentials, getValidToken])

  const [subjectModal, setSubjectModal] = useState<{ open: boolean; id?: number; name?: string }>({
    open: false
  })

  // 🔥 Защита от открытия без доступов (Модалка больше не нужна, просто Alert или Toast)
  const handleOpenChange = (open: boolean) => {
    if (open && !hasAlfaCredentials) {
      alert('Skonfiguruj AlfaCRM w ustawieniach konta (Email i Token)')
      return
    }
    setTeachersOpen(open)
  }

  const handleSync = async (e: React.MouseEvent) => {
    e.stopPropagation()
    await updateTeachers()
    // tRPC сам обновит дашборд после мутации, руками refresh() вызывать больше не нужно!
  }

  const handleSaveSubject = async (name: string) => {
    if (subjectModal.id) await updateSubject(subjectModal.id, name)
    else await createSubject(name)
    setSubjectModal({ open: false })
  }

  return (
    <>
      {!isCollapsed ? (
        <Collapsible
          open={isTeachersOpen && hasAlfaCredentials}
          onOpenChange={handleOpenChange}
          className={`flex flex-col shrink-0 pt-2 ${!isAlfaReady && hasAlfaCredentials ? 'opacity-50 pointer-events-none' : ''}`}
        >
          <CollapsibleTrigger asChild>
            <div className="px-6 mb-2 flex items-center justify-between group shrink-0 cursor-pointer text-sidebar-foreground/60 hover:text-sidebar-foreground">
              <p className="text-xs font-semibold uppercase tracking-wider transition-colors">
                Grafik
                {/* Индикатор загрузки токена AlfaCRM */}
                {!isAlfaReady && hasAlfaCredentials && (
                  <span className="ml-2 normal-case text-[10px] opacity-70">(Ładowanie...)</span>
                )}
              </p>

              <div className="flex items-center gap-1">
                {hasAlfaCredentials && isAlfaReady && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5"
                    onClick={handleSync}
                    disabled={isUpdating}
                  >
                    <RefreshCw
                      className={`h-3 w-3 ${isUpdating ? 'animate-spin text-primary' : ''}`}
                    />
                  </Button>
                )}
                <button className="p-1 rounded hover:bg-sidebar-accent">
                  {isTeachersOpen ? (
                    <ChevronUp className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            </div>
          </CollapsibleTrigger>

          <CollapsibleContent className="flex flex-col px-2 pb-2">
            {/* 🔥 Передаем состояния загрузки прямо в AsyncView */}
            <AsyncView isLoading={loading || isUpdating} isError={!!error} errorMsg={error || ''}>
              <div className="space-y-1">
                {subjects.map((subject) => (
                  <Collapsible key={subject.id}>
                    <div className="flex items-center justify-between px-2 py-1 text-sm font-medium hover:bg-sidebar-accent rounded group/sub">
                      <CollapsibleTrigger className="flex items-center gap-2 flex-1 overflow-hidden [&[data-state=open]>svg.chevron]:rotate-90">
                        <ChevronRight className="chevron h-3 w-3 shrink-0 text-sidebar-foreground/50 transition-transform duration-200" />
                        <Folder className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                        <span className="truncate">{subject.name}</span>
                      </CollapsibleTrigger>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 opacity-0 group-hover/sub:opacity-100 shrink-0"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          setSubjectModal({ open: true, id: subject.id, name: subject.name })
                        }}
                      >
                        <MoreHorizontal className="h-3 w-3 text-sidebar-foreground/60 hover:text-sidebar-foreground" />
                      </Button>
                    </div>

                    <CollapsibleContent>
                      <div className="ml-6 pl-2 border-l border-sidebar-border mt-1 space-y-1">
                        {subject.teachers.length === 0 ? (
                          <div className="text-[10px] text-sidebar-foreground/40 px-2 py-1">
                            Brak wykładowców
                          </div>
                        ) : (
                          subject.teachers.map((t) => (
                            <div
                              key={t.id}
                              className="flex items-center gap-2 px-2 py-1 text-xs hover:bg-sidebar-accent rounded cursor-pointer"
                              onClick={() => setViewMode('teacher', t.id)}
                            >
                              <User className="h-3 w-3 text-sidebar-foreground/50 shrink-0" />
                              <span className="truncate">{t.name}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                ))}
              </div>

              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-xs text-sidebar-foreground/70 mb-2 mt-2"
                onClick={() => setSubjectModal({ open: true })}
              >
                <Plus className="h-3 w-3 mr-2" /> Dodaj przedmiot
              </Button>

              {unassignedTeachers.length > 0 && (
                <Collapsible className="mt-4 pt-2 border-t border-sidebar-border">
                  <CollapsibleTrigger className="flex items-center justify-between w-full px-2 mb-1 py-1 hover:bg-sidebar-accent rounded cursor-pointer [&[data-state=open]>svg]:rotate-90">
                    <p className="text-[10px] uppercase font-semibold text-sidebar-foreground/50 tracking-wider">
                      Bez przedmiotu ({unassignedTeachers.length})
                    </p>
                    <ChevronRight className="h-3 w-3 text-sidebar-foreground/50 transition-transform duration-200" />
                  </CollapsibleTrigger>

                  <CollapsibleContent className="space-y-1">
                    {unassignedTeachers.map((t) => (
                      <div
                        key={t.id}
                        className="flex items-center gap-2 px-2 py-1 text-xs hover:bg-sidebar-accent rounded cursor-pointer text-orange-400"
                        onClick={() => setViewMode('teacher', t.id)}
                      >
                        <User className="h-3 w-3 shrink-0" />
                        <span className="truncate">{t.name}</span>
                      </div>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              )}
            </AsyncView>
          </CollapsibleContent>
        </Collapsible>
      ) : (
        <div className="flex justify-center p-2">
          <Button
            variant="ghost"
            onClick={() => {
              if (hasAlfaCredentials) toggleCollapse()
              else alert('Skonfiguruj AlfaCRM w ustawieniach konta (Email i Token)')
            }}
          >
            <CalendarDays className="h-4 w-4" />
          </Button>
        </div>
      )}

      <SubjectModal
        open={subjectModal.open}
        initialName={subjectModal.name || ''}
        onClose={() => setSubjectModal({ open: false })}
        onSave={handleSaveSubject}
        onDelete={subjectModal.id ? () => deleteSubject(subjectModal.id!) : undefined}
      />
    </>
  )
}
