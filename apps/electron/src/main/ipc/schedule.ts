import { ipcMain } from 'electron'
import { eq } from 'drizzle-orm'
import { getDb } from '../lib/db'
import { subjects, teachers, teacherSubjects, ApiResponse, Teacher, Subject, TeacherUpdateInput } from '@btw-app/shared'
import {
  CreateSubject,
  ScheduleDataResponse,
  SubjectWithTeachers,
  UpdateSubject,
  UpdateSubjectSchema,
  CreateSubjectSchema
} from '@btw-app/shared'



export const registerScheduleHandlers = async (): Promise<void> => {
  // --- 1. ПОЛУЧЕНИЕ ВСЕХ ДАННЫХ (Для Sidebar) ---
  ipcMain.handle('schedule:get-data', async (): Promise<ApiResponse<ScheduleDataResponse>> => {
    try {
      const db = await getDb()

      const allSubjects = await db.select().from(subjects).all()
      const allTeachers = await db.select().from(teachers).all()
      const allLinks = await db.select().from(teacherSubjects).all()

      // Группируем преподов по ID для быстрого доступа
      const teachersMap = new Map(allTeachers.map((t) => [t.id, t]))
      const assignedTeacherIds = new Set<number>()

      // Собираем предметы
      const subjectsWithTeachers: SubjectWithTeachers[] = allSubjects.map((sub) => {
        // Находим связи для этого предмета
        const linksForSubject = allLinks.filter((l) => l.subjectId === sub.id)

        // Достаем самих преподов
        const subTeachers = linksForSubject
          .map((link) => teachersMap.get(link.teacherId))
          .filter((t): t is Teacher => t !== undefined)

        // Отмечаем преподов как "распределенных"
        subTeachers.forEach((t) => assignedTeacherIds.add(t.id))

        return { ...sub, teachers: subTeachers }
      })

      // Ищем нераспределенных
      const unassignedTeachers = allTeachers.filter((t) => !assignedTeacherIds.has(t.id))

      return {
        success: true,
        data: { subjects: subjectsWithTeachers, unassignedTeachers }
      }
    } catch (error: any) {
      console.error(error)
      return { success: false, error: 'Bląd podczas ładowania danych grafiku' }
    }
  })

  // --- 2. ПЕРЕНЕСЕННЫЙ МЕТОД ПОЛУЧЕНИЯ ПРЕПОДОВ ---
  ipcMain.handle('schedule:get-teachers', async (): Promise<ApiResponse<Teacher[]>> => {
    try {
      const db = await getDb()
      const data = await db.select().from(teachers).all()
      return { success: true, data }
    } catch (error: any) {
      return { success: false, error: 'Nie udało się załadować nauczycieli' }
    }
  })

  // --- 3. CRUD ПРЕДМЕТОВ ---
  ipcMain.handle(
    'schedule:create-subject',
    async (_, data: CreateSubject): Promise<ApiResponse<Subject>> => {
      try {
        const validation = CreateSubjectSchema.safeParse(data)
        if (!validation.success) {
          return { success: false, error: 'Nieprawidłowe dane do tworzenia przedmiotu' }
        }
        const db = await getDb()
        const [newSubject] = await db.insert(subjects).values({ name: data.name }).returning()
        return { success: true, data: newSubject }
      } catch (error: any) {
        return { success: false, error: 'Błąd podczas tworzenia przedmiotu' }
      }
    }
  )

  ipcMain.handle(
    'schedule:update-subject',
    async (_, data: UpdateSubject): Promise<ApiResponse<null>> => {
      try {
        const validation = UpdateSubjectSchema.safeParse(data)
        if (!validation.success) {
          return { success: false, error: 'Nieprawidłowe dane do aktualizacji przedmiotu' }
        }
        const db = await getDb()
        await db.update(subjects).set({ name: data.name }).where(eq(subjects.id, data.id))
        return { success: true, data: null }
      } catch (error: any) {
        return { success: false, error: 'Bląd podczas aktualizacji przedmiotu' }
      }
    }
  )

  ipcMain.handle('schedule:delete-subject', async (_, id: number): Promise<ApiResponse<null>> => {
    try {
      const db = await getDb()
      // Сначала удаляем связи (чтобы не было висячих)
      await db.delete(teacherSubjects).where(eq(teacherSubjects.subjectId, id))
      // Затем сам предмет
      await db.delete(subjects).where(eq(subjects.id, id))
      return { success: true, data: null }
    } catch (error: any) {
      return { success: false, error: "Bląd podczas usuwania przedmiotu" }
    }
  })

  // --- 4. ПРИВЯЗКА ПРЕПОДА К ПРЕДМЕТАМ ---
  ipcMain.handle(
    'schedule:update-teacher-subjects',
    async (_, params: { teacherId: number; subjectIds: number[] }): Promise<ApiResponse<null>> => {
      try {
        const db = await getDb()
        const { teacherId, subjectIds } = params

        // Выполняем в транзакции: удаляем старые связи -> добавляем новые
        await db.transaction(async (tx) => {
          await tx.delete(teacherSubjects).where(eq(teacherSubjects.teacherId, teacherId))

          if (subjectIds.length > 0) {
            const newLinks = subjectIds.map((subId) => ({
              teacherId,
              subjectId: subId
            }))
            await tx.insert(teacherSubjects).values(newLinks)
          }
        })

        return { success: true, data: null }
      } catch (error: any) {
        return { success: false, error: 'Bląd podczas aktualizacji przedmiotów nauczyciela' }
      }
    }
  )

  // Дополнительно: Получить предметы конкретного препода
  ipcMain.handle(
    'schedule:get-teacher-subjects',
    async (_, teacherId: number): Promise<ApiResponse<number[]>> => {
      try {
        const db = await getDb()
        const links = await db
          .select({ subjectId: teacherSubjects.subjectId })
          .from(teacherSubjects)
          .where(eq(teacherSubjects.teacherId, teacherId))
        return { success: true, data: links.map((l) => l.subjectId) }
      } catch (error: any) {
        return { success: false, error: 'Bląd podczas ładowania przedmiotów nauczyciela' }
      }
    }
  )

  ipcMain.handle(
    'schedule:update-teacher',
    async (_, teacher: TeacherUpdateInput): Promise<ApiResponse<null>> => {
      try {
        const db = await getDb()
        await db.update(teachers)
          .set({
            name: teacher.name,
            email: teacher.email,
            phone: teacher.phone,
            avatarUrl: teacher.avatarUrl,
            note: teacher.note
          })
          .where(eq(teachers.id, teacher.id))
        return { success: true, data: null }
      } catch (error: any) {
        return { success: false, error: 'Bląd podczas aktualizacji nauczyciela' }
      }
    }
  )
}
