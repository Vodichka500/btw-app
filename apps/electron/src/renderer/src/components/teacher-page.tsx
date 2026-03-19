import { useEffect, useState } from 'react'
import { useUIStore } from '@/store/uiStore'
import { useScheduleStore } from '@/hooks/use-schedule-store'
import { trpc } from '@/lib/trpc'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { AsyncView } from '@/components/async-view'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ChevronDown, User, Pencil, RefreshCw, Edit3 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import TeacherScheduleGrid from '@/components/schedule/teacher-schedule-grid'
import { cn } from '@/lib/utils'

const TeacherPage = () => {
  const { selectedCategoryId: teacherId } = useUIStore()
  const { subjects, unassignedTeachers, updateTeacherSubjects, teacherUpdate } = useScheduleStore()

  const [selectedSubjects, setSelectedSubjects] = useState<number[]>([])
  const [popoverOpen, setPopoverOpen] = useState(false)

  const [isEditingNote, setIsEditingNote] = useState(false)
  const [noteValue, setNoteValue] = useState('')

  const [isFullScreenLike, setIsFullScreenLike] = useState(true)
  const [isScheduleRefreshing, setIsScheduleRefreshing] = useState(false)
  const [scheduleRefreshTrigger, setScheduleRefreshTrigger] = useState(0)
  const [isEditMode, setIsEditMode] = useState(false)

  const allTeachers = [...subjects.flatMap((s) => s.teachers), ...unassignedTeachers]
  const teacher = allTeachers.find((t) => t.id === teacherId)

  // =========================================================================
  // 🔥 tRPC: Заменяем ручной fetch и стейт loading на реактивный хук
  // =========================================================================
  const teacherSubjectsQuery = trpc.teachers.getSubjects.useQuery(
    { teacherId: teacherId! },
    {
      enabled: !!teacherId, // Запрашиваем только если teacherId не undefined
      refetchOnWindowFocus: false
    }
  )

  // Синхронизируем полученные данные с локальным стейтом для чекбоксов
  useEffect(() => {
    if (teacherSubjectsQuery.data) {
      // Предполагаю, что tRPC возвращает массив ID: [1, 2, 3]
      setSelectedSubjects(teacherSubjectsQuery.data)
    }
  }, [teacherSubjectsQuery.data])

  useEffect(() => {
    const checkHeight = () => {
      const ratio = window.innerHeight / window.screen.availHeight
      setIsFullScreenLike(ratio >= 0.85)
    }
    checkHeight()
    window.addEventListener('resize', checkHeight)
    return () => window.removeEventListener('resize', checkHeight)
  }, [])

  useEffect(() => {
    if (teacher) {
      setNoteValue(teacher.note || '')
      setIsEditingNote(false)
    }
  }, [teacher])

  const toggleSubject = (subjectId: number) => {
    setSelectedSubjects((prev) =>
      prev.includes(subjectId) ? prev.filter((id) => id !== subjectId) : [...prev, subjectId]
    )
  }

  // 🔥 Пока оставляем мутации из стора (легаси), но в будущем
  // их тоже можно заменить на trpc.teachers.updateSubjects.useMutation()
  const handleSaveSubjects = async () => {
    const success = await updateTeacherSubjects(teacherId!, selectedSubjects)
    if (success) {
      setPopoverOpen(false)
      teacherSubjectsQuery.refetch() // Обновляем данные tRPC после сохранения
    }
  }

  const handleSaveNote = async () => {
    if (!teacher) return

    const trimmedNote = noteValue.trim()
    const currentNote = teacher.note || ''

    if (trimmedNote === currentNote) {
      setIsEditingNote(false)
      return
    }

    const success = await teacherUpdate({
      id: teacher.id,
      name: teacher.name,
      email: teacher.email,
      phone: teacher.phone,
      avatarUrl: teacher.avatarUrl,
      note: trimmedNote || ''
    })

    if (success) setIsEditingNote(false)
  }

  if (!teacher)
    return <div className="p-8 text-center text-muted-foreground">Wykładowca nie znaleziony</div>

  const contactInfo = [teacher.email, teacher.phone].filter(Boolean).join(' | ')

  return (
    <div
      className={cn(
        'flex flex-col bg-background h-full',
        isFullScreenLike ? 'overflow-hidden' : 'overflow-y-auto'
      )}
    >
      <header className="flex items-center justify-between p-8 border-b border-border shrink-0">
        <div className="flex items-center gap-5">
          {/* ... Аватар и контактная инфа (без изменений) ... */}
          <div className="h-16 w-16 rounded-full bg-sidebar-accent flex items-center justify-center overflow-hidden shrink-0 border border-border">
            {teacher.avatarUrl &&
            teacher.avatarUrl !== 'https://cdn.alfacrm.pro/images/empty-male.png' &&
            teacher.avatarUrl !== 'https://cdn.alfacrm.pro/images/empty-female.png' ? (
              <img
                src={teacher.avatarUrl}
                alt={teacher.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <User className="h-8 w-8 text-muted-foreground" />
            )}
          </div>

          <div className="flex flex-col">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">{teacher.name}</h1>

            <div className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground mt-1 font-medium min-h-[24px]">
              {contactInfo && <span>{contactInfo}</span>}
              {contactInfo && <span className="text-muted-foreground/50">|</span>}

              {isEditingNote ? (
                <Input
                  autoFocus
                  value={noteValue}
                  onChange={(e) => setNoteValue(e.target.value)}
                  onBlur={handleSaveNote}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveNote()
                    if (e.key === 'Escape') {
                      setNoteValue(teacher.note || '')
                      setIsEditingNote(false)
                    }
                  }}
                  className="h-6 py-0 px-2 text-sm w-[250px] bg-background"
                />
              ) : (
                <div
                  className="flex items-center gap-1.5 group cursor-pointer text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setIsEditingNote(true)}
                  title="Edytuj notatkę"
                >
                  <span className={!teacher.note ? 'italic opacity-50' : ''}>
                    {teacher.note || 'Dodaj notatkę...'}
                  </span>
                  <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2 rounded-xl">
                Przedmioty <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="flex flex-col gap-4 w-64 rounded-xl p-4" align="end">
              <h4 className="font-semibold text-sm mb-3">Powiązanie z przedmiotami</h4>

              {/* 🔥 Скармливаем весь объект tRPC запроса в AsyncView */}
              <AsyncView
                query={teacherSubjectsQuery}
                errorMsg="Nie udało się załadować przedmiotów"
              >
                <div className="flex flex-col gap-3 mb-4 max-h-75 overflow-y-auto pr-2">
                  {subjects.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Brak dostępnych przedmiotów</p>
                  ) : (
                    subjects.map((sub) => (
                      <div key={sub.id} className="flex items-center space-x-3">
                        <Checkbox
                          id={`sub-${sub.id}`}
                          checked={selectedSubjects.includes(sub.id)}
                          onCheckedChange={() => toggleSubject(sub.id)}
                        />
                        <label
                          htmlFor={`sub-${sub.id}`}
                          className="text-sm font-medium leading-none cursor-pointer flex-1"
                        >
                          {sub.name}
                        </label>
                      </div>
                    ))
                  )}
                </div>

                <Button
                  onClick={handleSaveSubjects}
                  disabled={subjects.length === 0}
                  className="w-full"
                  size="sm"
                >
                  Zapisz
                </Button>
              </AsyncView>
            </PopoverContent>
          </Popover>

          <Button
            variant="outline"
            onClick={() => setScheduleRefreshTrigger((prev) => prev + 1)}
            disabled={isScheduleRefreshing}
            className="gap-2 rounded-xl"
          >
            <RefreshCw className={`h-4 w-4 ${isScheduleRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Synchronizuj</span>
          </Button>
          <Button
            variant={isEditMode ? 'default' : 'outline'}
            onClick={() => setIsEditMode(!isEditMode)}
            className="gap-2 rounded-xl transition-all"
          >
            <Edit3 className="h-4 w-4" />
            <span className="hidden sm:inline">
              {isEditMode ? 'Zakończ edycję' : 'Edytuj godziny'}
            </span>
          </Button>
        </div>
      </header>

      <TeacherScheduleGrid
        teacher={teacher}
        isFullScreenLike={isFullScreenLike}
        refreshTrigger={scheduleRefreshTrigger}
        onRefreshingChange={setIsScheduleRefreshing}
        isEditMode={isEditMode}
      />
    </div>
  )
}

export default TeacherPage
