import { trpc } from '@/lib/trpc'
import { toast } from 'sonner'

// 🔥 Магия TypeScript: Вытягиваем точный тип аргументов прямо из мутации tRPC!
// Тебе больше не нужно импортировать недостающие типы из @btw-app/shared.
type UpdateTeacherInput = Parameters<
  ReturnType<typeof trpc.teachers.update.useMutation>['mutateAsync']
>[0]

export function useScheduleStore() {
  const utils = trpc.useUtils()

  // =========================================================================
  // 1. ПОЛУЧЕНИЕ ДАННЫХ ДАШБОРДА (trpc.schedule.getDashboardData)
  // =========================================================================
  const {
    data,
    isLoading: loading,
    error: queryError,
    refetch
  } = trpc.schedule.getDashboardData.useQuery(undefined, {
    staleTime: 1000 * 60 * 5, // Кэшируем на 5 минут
    refetchOnWindowFocus: false
  })

  const subjects = data?.subjects || []
  const unassignedTeachers = data?.unassignedTeachers || []
  const error = queryError?.message || null

  // =========================================================================
  // 2. МУТАЦИИ ПРЕДМЕТОВ (trpc.subject.*)
  // =========================================================================
  const createSubjectMutation = trpc.subjects.create.useMutation({
    onSuccess: () => {
      toast.success('Przedmiot utworzony')
      utils.schedule.getDashboardData.invalidate() // Обновляем сайдбар
    },
    onError: (err) => toast.error(err.message)
  })

  const updateSubjectMutation = trpc.subjects.update.useMutation({
    onSuccess: () => {
      toast.success('Przedmiot zaktualizowany')
      utils.schedule.getDashboardData.invalidate()
    },
    onError: (err) => toast.error(err.message)
  })

  const deleteSubjectMutation = trpc.subjects.delete.useMutation({
    onSuccess: () => {
      toast.success('Przedmiot usunięty')
      utils.schedule.getDashboardData.invalidate()
    },
    onError: (err) => toast.error(err.message)
  })

  // =========================================================================
  // 3. МУТАЦИИ ПРЕПОДАВАТЕЛЕЙ (trpc.teacher.*)
  // =========================================================================
  const updateTeacherSubjectsMutation = trpc.teachers.updateSubjects.useMutation({
    onSuccess: (_, variables) => {
      toast.success('Przedmioty zapisane')
      utils.schedule.getDashboardData.invalidate()
      // Если мы находимся на странице учителя, обновляем и локальный список его предметов
      utils.teachers.getSubjects.invalidate({ teacherId: variables.teacherId })
    },
    onError: (err) => toast.error(err.message)
  })

  const teacherUpdateMutation = trpc.teachers.update.useMutation({
    onSuccess: () => {
      toast.success('Nauczyciel zaktualizowany')
      utils.schedule.getDashboardData.invalidate()
    },
    onError: (err) => toast.error(err.message)
  })

  // =========================================================================
  // 4. ВОЗВРАЩАЕМ ЗНАКОМЫЙ ИНТЕРФЕЙС
  // =========================================================================
  return {
    loading,
    error,
    subjects,
    unassignedTeachers,
    refresh: async () => {
      await refetch()
    },

    createSubject: async (name: string) => {
      await createSubjectMutation.mutateAsync({ name })
    },

    updateSubject: async (id: number, name: string) => {
      await updateSubjectMutation.mutateAsync({ id, name })
    },

    deleteSubject: async (id: number) => {
      // Zod схема delete ожидает объект: { id: z.number() }
      await deleteSubjectMutation.mutateAsync({ id })
    },

    updateTeacherSubjects: async (teacherId: number, subjectIds: number[]) => {
      try {
        await updateTeacherSubjectsMutation.mutateAsync({ teacherId, subjectIds })
        return true
      } catch {
        return false
      }
    },

    teacherUpdate: async (data: UpdateTeacherInput) => {
      try {
        await teacherUpdateMutation.mutateAsync(data)
        return true
      } catch {
        return false
      }
    }
  }
}
