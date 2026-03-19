'use client'

import { useState, useEffect, useMemo } from 'react'
import { useAlfaApi } from '@/hooks/use-alfa-api'
import { trpc } from '@/lib/trpc'
import { AsyncView } from '@/components/async-view'
import { cn } from '@/lib/utils'
import { TeacherScheduleProps, Lesson, WorkingHour } from './types'
import { ScheduleTable, SkeletonSchedule, LessonBlock, WorkingHourBlock } from './schedule-ui'
import { EditWorkingHourView } from './edit-view'

// Базовый вид (Только просмотр)
function BaseView({ data, dynamicHours }: { data: any; dynamicHours: number[] }) {
  return (
    <ScheduleTable
      dynamicHours={dynamicHours}
      renderCell={(dayIndex, hour) => {
        // Достаем все уроки, которые бэкенд положил в эту ячейку
        const rawLessons = data.lessonsMap[`${dayIndex}-${hour}`] || []

        // 🔥 ФИЛЬТР: Рендерим урок только в тот час, когда он НАЧИНАЕТСЯ
        const lessons = rawLessons.filter((ls: Lesson) => {
          const startH = parseInt(ls.timeFrom.split(':')[0], 10)
          return startH === hour
        })

        const hours = data.workingHours.filter(
          (wh: WorkingHour) =>
            parseInt(wh.timeFrom.split(':')[0], 10) === hour && wh.dayIndex === dayIndex
        )

        return (
          <div className="absolute inset-0 pointer-events-none z-10">
            {hours.map((wh: WorkingHour) => (
              <WorkingHourBlock key={wh.id} wh={wh} />
            ))}
            {lessons.map((ls: Lesson, idx: number) => (
              <LessonBlock key={`${ls.timeFrom}-${idx}`} lesson={ls} />
            ))}
          </div>
        )
      }}
    />
  )
}

export default function TeacherScheduleGrid({
  teacher,
  isFullScreenLike = true,
  refreshTrigger,
  onRefreshingChange,
  isEditMode = false
}: TeacherScheduleProps) {
  const { getValidToken } = useAlfaApi()
  const [alfaToken, setAlfaToken] = useState<string | null>(null)

  // 1. Сначала получаем временный токен AlfaCRM
  useEffect(() => {
    getValidToken().then(setAlfaToken)
  }, [getValidToken])

  // =========================================================================
  // 🔥 tRPC: Реактивные запросы (Разделяем логику CRM и локальной БД)
  // =========================================================================

  // Запрос в AlfaCRM (Ждет, пока появится токен)
  const lessonsQuery = trpc.alfa.getTeacherLessons.useQuery(
    { teacherAlfacrmId: teacher.alfacrmId, alfaTempToken: alfaToken! },
    {
      enabled: !!teacher.alfacrmId && !!alfaToken,
      refetchOnWindowFocus: false
    }
  )

  // Запрос в нашу БД (Рабочие часы)
  const hoursQuery = trpc.teachers.getWorkingHours.useQuery(
    // 🔥 Поправил роутер на trpc.teacher
    { teacherId: teacher.id },
    {
      enabled: !!teacher.id,
      refetchOnWindowFocus: false
    }
  )

  // =========================================================================
  // 🔥 Синхронизация по кнопке из Header (refreshTrigger)
  // =========================================================================
  useEffect(() => {
    if (refreshTrigger > 0) {
      const doRefresh = async () => {
        onRefreshingChange(true)

        const newToken = await getValidToken()
        if (newToken !== alfaToken) setAlfaToken(newToken)

        await Promise.all([lessonsQuery.refetch(), hoursQuery.refetch()])

        onRefreshingChange(false)
      }
      doRefresh()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshTrigger])

  const data = useMemo(
    () => ({
      lessonsMap: lessonsQuery.data ?? {},
      workingHours: hoursQuery.data ?? []
    }),
    [lessonsQuery.data, hoursQuery.data]
  )

  const combinedQuery = {
    isLoading: lessonsQuery.isLoading || hoursQuery.isLoading || !alfaToken,
    isError: lessonsQuery.isError || hoursQuery.isError,
    error: lessonsQuery.error || hoursQuery.error,
    refetch: () => {
      lessonsQuery.refetch()
      hoursQuery.refetch()
    }
  }

  const dynamicHours = useMemo(() => {
    if (isEditMode) return Array.from({ length: 16 }, (_, i) => i + 7)

    let minHour = 24
    let maxHour = 0
    let hasData = false

    Object.keys(data.lessonsMap).forEach((key) => {
      if (data.lessonsMap[key].length > 0) {
        const h = parseInt(key.split('-')[1], 10)
        if (h < minHour) minHour = h
        if (h > maxHour) maxHour = h
        hasData = true
      }
    })

    data.workingHours.forEach((wh) => {
      const startH = parseInt(wh.timeFrom.split(':')[0], 10)
      let endH = parseInt(wh.timeTo.split(':')[0], 10)
      if (parseInt(wh.timeTo.split(':')[1], 10) === 0) endH -= 1
      if (startH < minHour) minHour = startH
      if (endH > maxHour) maxHour = endH
      hasData = true
    })

    if (!hasData) return Array.from({ length: 11 }, (_, i) => i + 9)

    const startHour = Math.max(0, minHour - 1)
    const endHour = Math.min(23, maxHour + 1)
    return Array.from({ length: endHour - startHour + 1 }, (_, i) => i + startHour)
  }, [data, isEditMode])

  return (
    <div
      className={cn(
        'w-full bg-background flex flex-col',
        isFullScreenLike ? 'flex-1 overflow-y-auto' : 'flex-none overflow-visible'
      )}
    >
      <AsyncView query={combinedQuery} loader={<SkeletonSchedule />}>
        <div className="p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto space-y-6 w-full">
          {isEditMode ? (
            <EditWorkingHourView
              data={data}
              dynamicHours={dynamicHours}
              teacherId={teacher.id}
              onRefresh={combinedQuery.refetch}
            />
          ) : (
            <BaseView data={data} dynamicHours={dynamicHours} />
          )}
        </div>
      </AsyncView>
    </div>
  )
}
