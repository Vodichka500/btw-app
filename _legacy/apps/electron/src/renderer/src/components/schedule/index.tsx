'use client'

import { useState, useEffect, useMemo } from 'react'
import { useAlfaCrm } from '@/hooks/use-alfa-crm'
import { AsyncView } from '@/components/async-view'
import { cn } from '@/lib/utils'
import { TeacherScheduleProps, Lesson, WorkingHour } from './types'
import { ScheduleTable, SkeletonSchedule, LessonBlock, WorkingHourBlock } from './schedule-ui'
import { EditWorkingHourView } from './edit-view'

// Базовый вид (Только просмотр). Он крошечный, поэтому оставляем его здесь.
function BaseView({ data, dynamicHours }: { data: any; dynamicHours: number[] }) {
  return (
    <ScheduleTable
      dynamicHours={dynamicHours}
      renderCell={(dayIndex, hour) => {
        const lessons = data.lessonsMap[`${dayIndex}-${hour}`] || []
        const hours = data.workingHours.filter(
          (wh: WorkingHour) =>
            parseInt(wh.timeFrom.split(':')[0], 10) === hour && wh.dayIndex === dayIndex
        )

        return (
          <div className="absolute inset-0 pointer-events-none">
            {hours.map((wh: WorkingHour) => (
              <WorkingHourBlock key={wh.id} wh={wh} />
            ))}
            {lessons.map((ls: Lesson, idx: number) => (
              <LessonBlock key={idx} lesson={ls} />
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
  const { getTeacherSchedule } = useAlfaCrm()

  const [data, setData] = useState<{
    lessonsMap: Record<string, Lesson[]>
    workingHours: WorkingHour[]
  }>({
    lessonsMap: {},
    workingHours: []
  })
  const [loading, setLoading] = useState(true)

  const loadSchedule = async () => {
    setLoading(true)
    const res = await getTeacherSchedule(teacher.alfacrmId, teacher.id)
    if (res) setData(res)
    setLoading(false)
  }

  useEffect(() => {
    if (teacher?.alfacrmId) loadSchedule()
  }, [teacher.alfacrmId])

  useEffect(() => {
    if (refreshTrigger > 0) {
      const doRefresh = async () => {
        onRefreshingChange(true)
        await loadSchedule()
        onRefreshingChange(false)
      }
      doRefresh()
    }
  }, [refreshTrigger])

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
      <AsyncView isLoading={loading} loader={<SkeletonSchedule />}>
        <div className="p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto space-y-6 w-full">
          {isEditMode ? (
            <EditWorkingHourView
              data={data}
              dynamicHours={dynamicHours}
              teacherId={teacher.id}
              onRefresh={loadSchedule}
            />
          ) : (
            <BaseView data={data} dynamicHours={dynamicHours} />
          )}
        </div>
      </AsyncView>
    </div>
  )
}
