import { useState, useEffect } from 'react'
import { isAuthResponse, UpdateTeachersResponse, Teacher, ApiResponse } from '@btw-app/shared'
import { toast } from 'sonner' // Предполагаю, что ты используешь sonner для уведомлений

export function useAlfaCrm() {
  const [isAuth, setIsAuth] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false) // Стейт для спиннера обновления
  const [error, setError] = useState<string | null>(null) // Глобальная ошибка для AsyncView
  const [teachersList, setTeachersList] = useState<Teacher[]>([]) // Список преподавателей для UI

  // Проверяем при загрузке, есть ли в базе токен
  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    setLoading(true)
    setError(null)
    try {
      const res: ApiResponse<isAuthResponse> =
        await window.electron.ipcRenderer.invoke('alfa-crm:check-auth')

      if (!res.success) {
        setIsAuth(false)
        return
      }

      setIsAuth(res.data.isAuth)

      // Если авторизованы, сразу грузим список преподавателей из локальной БД
      if (res.data.isAuth) {
        await getTeachers()
      }
    } catch (err: any) {
      console.error('Failed to check AlfaCRM auth', err)
      setIsAuth(false)
      setError(err.message || 'Ошибка проверки авторизации')
    } finally {
      setLoading(false)
    }
  }

  // Эта функция будет вызываться из модалки
  const login = async (email: string, apiKey: string) => {
    setLoading(true)
    setError(null)
    try {
      const loginRes: ApiResponse<null> = await window.electron.ipcRenderer.invoke(
        'alfa-crm:login',
        { email, apiKey }
      )

      if (!loginRes.success) {
        toast.error(loginRes.error)
        setIsAuth(false)
        return false
      }

      // Если логин успешен, еще раз проверяем статус (для надежности и обновления стейтов)
      const checkRes: ApiResponse<isAuthResponse> =
        await window.electron.ipcRenderer.invoke('alfa-crm:check-auth')

      if (checkRes.success && checkRes.data.isAuth) {
        setIsAuth(true)
        await getTeachers() // Подгружаем преподов после входа
        return true
      }

      return false
    } catch (err: any) {
      console.error('Login failed', err)
      toast.error('Krityczny błąd podczas logowania. Sprawdź konsolę.')
      return false
    } finally {
      setLoading(false)
    }
  }

  const updateTeachers = async () => {
    setIsUpdating(true)
    setError(null)
    try {
      const res: ApiResponse<UpdateTeachersResponse> = await window.electron.ipcRenderer.invoke(
        'alfa-crm:update-teachers'
      )

      if (!res.success) {
        throw new Error(res.error)
      }

      toast.success(`Pomyślnie zsynchronizowano ${res.data.added} nauczycieli.`)
      await getTeachers() // Обновляем список на фронте после синка
    } catch (err: any) {
      console.error('Failed to update teachers', err)
      const errorMsg = err.message || 'Nie udało się zsynchronizować nauczycieli.'
      setError(errorMsg)
      toast.error(errorMsg)
    } finally {
      setIsUpdating(false)
    }
  }

  const getTeachers = async () => {
    try {
      const res: ApiResponse<Teacher[]> =
        await window.electron.ipcRenderer.invoke('alfa-crm:get-teachers')

      if (!res.success) {
        console.error(res.error)
        setError(res.error)
        setTeachersList([])
        return
      }

      setTeachersList(res.data)
    } catch (err: any) {
      console.error('Failed to get teachers', err)
      setError('Nie udało się załadować listy nauczycieli.')
    }
  }

  const logout = async () => {
    try {
      const res: ApiResponse<null> = await window.electron.ipcRenderer.invoke('alfa-crm:logout')
      if (res.success) {
        setIsAuth(false)
        setTeachersList([])
        toast.success('Wylogowano pomyślnie.')
      }
    } catch (err) {
      console.error('Failed to logout', err)
    }
  }

  const getTeacherSchedule = async (teacherAlfacrmId: number, localTeacherId: number) => {
    try {
      const [lessonsRes, hoursRes] = await Promise.all([
        window.electron.ipcRenderer.invoke('alfa-crm:get-teacher-lessons', teacherAlfacrmId),
        window.electron.ipcRenderer.invoke('schedule:get-working-hours', localTeacherId)
      ])

      if (!lessonsRes.success) throw new Error(lessonsRes.error)
      if (!hoursRes.success) throw new Error(hoursRes.error)

      return {
        lessonsMap: lessonsRes.data as Record<string, any[]>,
        workingHours: hoursRes.data as any[] // Сырой массив объектов из БД!
      }
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || 'Nie udało się załadować harmonogramu nauczyciela.')
      return null
    }
  }

  // 🔥 Новые CRUD методы
  const createWorkingHour = async (data: any) =>
    window.electron.ipcRenderer.invoke('schedule:create-working-hour', data)
  const updateWorkingHour = async (data: any) =>
    window.electron.ipcRenderer.invoke('schedule:update-working-hour', data)
  const deleteWorkingHour = async (id: number) =>
    window.electron.ipcRenderer.invoke('schedule:delete-working-hour', id)

  return {
    isAuth,
    loading,
    isUpdating,
    error,
    teachersList,
    login,
    logout,
    checkAuth,
    updateTeachers,
    getTeachers,
    getTeacherSchedule,
    createWorkingHour,
    updateWorkingHour,
    deleteWorkingHour
  }
}
