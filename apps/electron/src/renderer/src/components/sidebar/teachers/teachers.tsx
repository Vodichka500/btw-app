import { ReactNode, useEffect, useState, useRef } from 'react'
import { useUIStore } from '@/store/uiStore'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/shared/ui/collapsible'
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
  AlertCircle
} from 'lucide-react'
import { Button } from '@/components/shared/ui/button'
import { AsyncView } from '@/components/shared/async-view'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/shared/ui/dialog'
import { toast } from 'sonner'

import { authClient } from '@/lib/auth-client'
import { useAlfaApi } from '@/hooks/use-alfa-api'
import { useAlfaCrm } from '@/hooks/use-alfa-crm'
import { useScheduleStore } from '@/hooks/use-schedule-store'
import { SubjectModal } from '@/components/sidebar/teachers/subject-modal'

export const Teachers = (): ReactNode => {
  const { isCollapsed, toggleCollapse, setViewMode, isTeachersOpen, setTeachersOpen } = useUIStore()

  const { data: session } = authClient.useSession()
  const alfaEmail = session?.user?.alfaEmail
  const alfaToken = session?.user?.alfaToken
  const hasAlfaCredentials = !!(alfaEmail && alfaToken)

  const { getValidToken } = useAlfaApi()
  const { isUpdating, updateTeachers } = useAlfaCrm()

  const [isAlfaReady, setIsAlfaReady] = useState(false)
  const [alfaAuthError, setAlfaAuthError] = useState(false)
  const [showErrorModal, setShowErrorModal] = useState(false)

  const {
    loading,
    error,
    subjects,
    unassignedTeachers,
    createSubject,
    updateSubject,
    deleteSubject
  } = useScheduleStore()

  // 🔥 Запоминаем предыдущие значения, чтобы знать, когда юзер их поменял
  const prevCredsRef = useRef(`${alfaEmail}-${alfaToken}`)

  useEffect(() => {
    let isMounted = true

    // Проверяем, изменились ли креды с прошлого раза
    const currentCreds = `${alfaEmail}-${alfaToken}`
    const didCredsChange = prevCredsRef.current !== currentCreds
    prevCredsRef.current = currentCreds

    if (hasAlfaCredentials) {
      setIsAlfaReady(false)
      setAlfaAuthError(false)

      // 🔥 Если креды изменились -> передаем true (игнорируем кэш и идем на сервер)
      getValidToken(didCredsChange)
        .then((token) => {
          if (!isMounted) return
          if (token) {
            setIsAlfaReady(true)
          } else {
            setAlfaAuthError(true)
          }
        })
        .catch(() => {
          if (!isMounted) return
          setAlfaAuthError(true)
        })
    } else {
      setIsAlfaReady(false)
      setAlfaAuthError(false)
    }

    return () => {
      isMounted = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasAlfaCredentials, alfaEmail, alfaToken])

  const [subjectModal, setSubjectModal] = useState<{ open: boolean; id?: number; name?: string }>({
    open: false
  })

  const isLoadingAlfa = hasAlfaCredentials && !isAlfaReady && !alfaAuthError

  const handleOpenChange = (open: boolean) => {
    if (open) {
      if (!hasAlfaCredentials) {
        toast.warning('Skonfiguruj AlfaCRM w ustawieniach konta (Email i Token)')
        return
      }
      if (alfaAuthError) {
        setShowErrorModal(true)
        return
      }
    }
    setTeachersOpen(open)
  }

  const handleSync = async (e: React.MouseEvent) => {
    e.stopPropagation()
    await updateTeachers()
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
          open={isTeachersOpen && hasAlfaCredentials && isAlfaReady}
          onOpenChange={handleOpenChange}
          className={`flex flex-col shrink-0 pt-2 ${isLoadingAlfa ? 'opacity-50 pointer-events-none' : ''}`}
        >
          <div className="px-6 mb-2 flex w-full items-center justify-between group shrink-0">

            <CollapsibleTrigger className="flex items-center outline-none flex-1 text-sidebar-foreground/60 hover:text-sidebar-foreground cursor-pointer">
              <p className="text-xs font-semibold uppercase tracking-wider transition-colors flex items-center">
                Grafik
                {isLoadingAlfa && (
                  <span className="ml-2 normal-case text-[10px] opacity-70">(Ładowanie...)</span>
                )}
                {alfaAuthError && (
                  <span
                    className="ml-2 normal-case text-[10px] text-destructive opacity-90"
                    title="Błąd logowania"
                  >
                    (Błąd API)
                  </span>
                )}
              </p>
            </CollapsibleTrigger>

            <div className="flex items-center gap-1">

              {hasAlfaCredentials && isAlfaReady && !alfaAuthError && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 text-sidebar-foreground/60 hover:text-sidebar-foreground"
                  onClick={handleSync}
                  disabled={isUpdating}
                >
                  <RefreshCw
                    className={`h-3 w-3 ${isUpdating ? 'animate-spin text-primary' : ''}`}
                  />
                </Button>
              )}

              <CollapsibleTrigger className="p-1 rounded transition-colors text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent cursor-pointer outline-none">
                {isTeachersOpen ? (
                  <ChevronUp className="h-3.5 w-3.5" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5" />
                )}
              </CollapsibleTrigger>
            </div>
          </div>

          <CollapsibleContent className="flex flex-col px-4 pb-2">
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
                className="w-full justify-start px-2 text-xs text-sidebar-foreground/70 mb-2 mt-2"
                onClick={() => setSubjectModal({ open: true })}
              >
                <Plus className="h-3 w-3 mr-2 shrink-0" /> Dodaj przedmiot
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
              if (!hasAlfaCredentials) {
                toast.warning('Skonfiguruj AlfaCRM w ustawieniach konta (Email i Token)')
              } else if (alfaAuthError) {
                setShowErrorModal(true)
              } else {
                toggleCollapse()
              }
            }}
          >
            <CalendarDays className="h-4 w-4" />
          </Button>
        </div>
      )}

      <Dialog open={showErrorModal} onOpenChange={setShowErrorModal}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Błąd autoryzacji AlfaCRM
            </DialogTitle>
            <DialogDescription className="pt-2">
              Wprowadzone dane logowania (Email lub Token API) są nieprawidłowe lub straciły
              ważność.
              <br />
              <br />
              Przejdź do ustawień konta, zaktualizuj swoje <strong>Credentials</strong> i upewnij
              się, że token jest aktywny w panelu AlfaCRM.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button
              onClick={() => {
                setShowErrorModal(false)
                setViewMode('account')
              }}
              className="rounded-xl w-full"
            >
              Przejdź do ustawień
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
