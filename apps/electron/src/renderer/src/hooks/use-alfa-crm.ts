import { useState } from 'react'
import { toast } from 'sonner'
import { trpc } from '@/lib/trpc'
import { useAlfaApi } from './use-alfa-api'

export function useAlfaCrm() {
  const { getValidToken } = useAlfaApi()
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // tRPC мутация для обновления
  const updateTeachersMutation = trpc.alfa.updateTeachers.useMutation()
  const trpcUtils = trpc.useUtils()

  const updateTeachers = async () => {
    setIsUpdating(true)
    setError(null)
    try {
      // 1. Берем токен (сгенерирует новый или отдаст из кэша)
      const alfaTempToken = await getValidToken()
      if (!alfaTempToken) {
        throw new Error('Brak dostępu do AlfaCRM. Sprawdź ustawienia profilu.')
      }

      // 2. Отправляем запрос на НАШ сервер
      const res = await updateTeachersMutation.mutateAsync({ alfaTempToken })

      toast.success(
        `Pomyślnie zsynchronizowano. Dodano: ${res.added}, Zaktualizowano: ${res.updated}`
      )

      // 3. Инвалидируем локальные данные tRPC, чтобы UI обновился
      // trpcUtils.teachers.getAll.invalidate(); // Раскомментируй, когда будет роутер для учителей

      return true
    } catch (err: any) {
      console.error('Failed to update teachers', err)
      const errorMsg = err.message || 'Nie udało się zsynchronizować nauczycieli.'
      setError(errorMsg)
      toast.error(errorMsg)
      return false
    } finally {
      setIsUpdating(false)
    }
  }

  const getTeacherSchedule = async (teacherAlfacrmId: number) => {
    try {
      const alfaTempToken = await getValidToken()
      if (!alfaTempToken) throw new Error('Brak dostępu do AlfaCRM.')

      // Сервер сам сходит в AlfaCRM и распарсит все страницы
      const lessonsMap = await trpcUtils.alfa.getTeacherLessons.fetch({
        teacherAlfacrmId,
        alfaTempToken
      })

      return lessonsMap
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || 'Nie udało się załadować harmonogramu nauczyciela.')
      return null
    }
  }

  return {
    isUpdating,
    error,
    updateTeachers,
    getTeacherSchedule
  }
}
