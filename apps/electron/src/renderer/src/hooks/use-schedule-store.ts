import { create } from 'zustand'
import { toast } from 'sonner'
import { SubjectWithTeachers, Teacher, TeacherUpdateInput } from '@btw-app/shared'

interface ScheduleState {
  loading: boolean
  error: string | null
  subjects: SubjectWithTeachers[]
  unassignedTeachers: Teacher[]

  // Методы
  refresh: () => Promise<void>
  createSubject: (name: string) => Promise<void>
  updateSubject: (id: number, name: string) => Promise<void>
  deleteSubject: (id: number) => Promise<void>
  updateTeacherSubjects: (teacherId: number, subjectIds: number[]) => Promise<boolean>
  teacherUpdate: (data: TeacherUpdateInput) => Promise<boolean>
}

// Переводим хук на Zustand
export const useScheduleStore = create<ScheduleState>((set, get) => ({
  loading: true,
  error: null,
  subjects: [],
  unassignedTeachers: [],

  refresh: async () => {
    set({ loading: true, error: null })
    try {
      const res = await window.api.scheduleGetData()
      if (!res.success) throw new Error(res.error)

      set({
        subjects: res.data.subjects,
        unassignedTeachers: res.data.unassignedTeachers
      })
    } catch (err: any) {
      set({ error: err.message })
      toast.error(err.message)
    } finally {
      set({ loading: false })
    }
  },

  createSubject: async (name: string) => {
    const res = await window.api.scheduleCreateSubject({ name })
    if (res.success) {
      toast.success('Przedmiot utworzony')
      await get().refresh() // Обновляем данные для всех компонентов!
    } else {
      toast.error(res.error)
    }
  },

  updateSubject: async (id: number, name: string) => {
    const res = await window.api.scheduleUpdateSubject({ id, name })
    if (res.success) {
      toast.success('Przedmiot zaktualizowany')
      await get().refresh()
    } else {
      toast.error(res.error)
    }
  },

  deleteSubject: async (id: number) => {
    const res = await window.api.scheduleDeleteSubject(id)
    if (res.success) {
      toast.success('Przedmiot usunięty')
      await get().refresh()
    } else {
      toast.error(res.error)
    }
  },

  // Вызывается со страницы преподавателя
  updateTeacherSubjects: async (teacherId: number, subjectIds: number[]) => {
    const res = await window.api.scheduleUpdateTeacherSubjects(teacherId, subjectIds)
    if (res.success) {
      toast.success('Przedmity zapisane')
      await get().refresh() // 🔥 Сайдбар мгновенно обновится
      return true
    } else {
      toast.error(res.error)
      return false
    }
  },

  teacherUpdate: async (data: TeacherUpdateInput) => {
    const res = await window.api.scheduleTeacherUpdate(data)
    if (res.success) {
      toast.success('Nauczyciel zaktualizowany')
      await get().refresh()
      return true
    } else {
      toast.error(res.error)
      return false
    }
  }
}))
