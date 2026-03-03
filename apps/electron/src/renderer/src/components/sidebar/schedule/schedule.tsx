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
  MoreHorizontal,
  LogOut
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AsyncView } from '@/components/async-view'
import { useAlfaCrm } from '@/hooks/use-alfa-crm'
import { useScheduleStore } from '@/hooks/use-schedule-store'
import { SubjectModal } from './subject-modal'
import AlfacrmAuthModal from '@/components/alfacrm-auth-modal'
import { AlfaCrmAuthInput } from '@btw-app/shared'

interface Props {
  scheduleOpen: boolean
  setScheduleOpen: (open: boolean) => void
}

export const Schedule = ({ setScheduleOpen, scheduleOpen }: Props): ReactNode => {
  const { isCollapsed, toggleCollapse, setViewMode } = useUIStore()
  const { isAuth, isUpdating, updateTeachers, logout, login } = useAlfaCrm()
  const {
    loading,
    error,
    subjects,
    unassignedTeachers,
    refresh,
    createSubject,
    updateSubject,
    deleteSubject
  } = useScheduleStore()

  useEffect(() => {
    refresh()
  }, [])

  const [subjectModal, setSubjectModal] = useState<{ open: boolean; id?: number; name?: string }>({
    open: false
  })

  const [openAuthModal, setOpenAuthModal] = useState(false)

  const handleOpenChange = (open: boolean) => {
    if (open && !isAuth) {
      setOpenAuthModal(true) // Блокируем открытие, показываем модалку
      return
    }
    setScheduleOpen(open)
  }

  const handleSync = async (e: React.MouseEvent) => {
    e.stopPropagation()
    await updateTeachers()
    refresh()
  }

  const handleSaveSubject = async (name: string) => {
    if (subjectModal.id) await updateSubject(subjectModal.id, name)
    else await createSubject(name)
    setSubjectModal({ open: false })
  }

  const handleLogout = async () => {
    await logout()
    setScheduleOpen(false) // Схлопываем аккордеон
  }

  // 🔥 ХЕНДЛЕР ДЛЯ ВХОДА ИЗ МОДАЛКИ
  const handleLogin = async (data: AlfaCrmAuthInput) => {
    const success = await login(data.email, data.apiKey)
    if (success) {
      setOpenAuthModal(false)
      setScheduleOpen(true) // Открываем раздел при успехе
      refresh()
    }
  }

  return (
    <>
      {!isCollapsed ? (
        <Collapsible
          open={scheduleOpen}
          onOpenChange={handleOpenChange} // <-- Здесь теперь работает защита
          className="flex flex-col shrink-0 pt-2"
        >
          <CollapsibleTrigger asChild>
            <div className="px-6 mb-2 flex items-center justify-between group shrink-0 cursor-pointer text-sidebar-foreground/60 hover:text-sidebar-foreground">
              <p className="text-xs font-semibold uppercase tracking-wider transition-colors">
                Grafik
              </p>
              <div className="flex items-center gap-1">
                {isAuth && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5"
                    onClick={handleSync}
                    disabled={isUpdating}
                  >
                    <RefreshCw className={`h-3 w-3 ${isUpdating ? 'animate-spin' : ''}`} />
                  </Button>
                )}
                <button className="p-1 rounded hover:bg-sidebar-accent">
                  {scheduleOpen ? (
                    <ChevronUp className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            </div>
          </CollapsibleTrigger>

          <CollapsibleContent className="flex flex-col px-2 pb-2">
            <AsyncView isLoading={loading && !isUpdating} isError={!!error} errorMsg={error || ''}>
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
                className="w-full justify-start text-xs text-sidebar-foreground/70 mb-2"
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

            <div className="mt-6 border-t border-sidebar-border pt-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-xs text-red-500/80 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                onClick={handleLogout}
              >
                <LogOut className="h-3.5 w-3.5 mr-2 opacity-80" />
                Wyloguj się z Alfa CRM
              </Button>
            </div>
          </CollapsibleContent>
        </Collapsible>
      ) : (
        <div className="flex justify-center p-2">
          <Button
            variant="ghost"
            onClick={() => (isAuth ? toggleCollapse() : setOpenAuthModal(true))}
          >
            <CalendarDays className="h-4 w-4" />
          </Button>
        </div>
      )}

      <AlfacrmAuthModal open={openAuthModal} onOpenChange={setOpenAuthModal} onSave={handleLogin} />

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
