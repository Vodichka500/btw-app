'use client'

import { useState, useEffect, useMemo } from 'react'
import { Clock } from 'lucide-react'
import { useAlfaCrm } from '@/hooks/use-alfa-crm'
import { AsyncView } from '@/components/async-view'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'

const DAYS = ['PN', 'WT', 'ŚR', 'CZ', 'PT', 'SO', 'ND']
const FULL_DAYS = ['Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota', 'Niedziela']

interface TimeSegment {
  startMin: number
  endMin: number
}
interface Lesson {
  subject: string
  student?: string
  timeFrom: string
  timeTo: string
  startMin: number
  endMin: number
}
interface ScheduleSlot {
  workingSegments: TimeSegment[]
  lessons: Lesson[]
}

// 🔥 Добавили интерфейсы для управления обновлением извне
interface TeacherScheduleProps {
  teacher: {
    alfacrmId: number
    name: string
  }
  isFullScreenLike?: boolean
  refreshTrigger: number
  onRefreshingChange: (isRefreshing: boolean) => void
  isEditMode?: boolean // 🔥 Режим редактирования
  onTimeSelect?: (dayIndex: number, startHour: number, endHour: number) => void // 🔥 Колбэк при завершении выделения
}

export default function TeacherScheduleGrid({
  teacher,
  isFullScreenLike = true,
  refreshTrigger,
  onRefreshingChange,
  isEditMode = false,
  onTimeSelect
}: TeacherScheduleProps) {
  const { getTeacherSchedule } = useAlfaCrm()

  const [dragStart, setDragStart] = useState<{ day: number; hour: number } | null>(null)
  const [dragCurrent, setDragCurrent] = useState<{ day: number; hour: number } | null>(null)

  const handleMouseDown = (dayIndex: number, hour: number) => {
    if (!isEditMode) return
    setDragStart({ day: dayIndex, hour })
    setDragCurrent({ day: dayIndex, hour })
  }

  const handleMouseEnter = (dayIndex: number, hour: number) => {
    if (!isEditMode || !dragStart) return
    // Разрешаем тянуть только внутри одного дня (по вертикали)
    if (dayIndex === dragStart.day) {
      setDragCurrent({ day: dayIndex, hour })
    }
  }

  const handleMouseUp = () => {
    if (!isEditMode || !dragStart || !dragCurrent) return

    if (onTimeSelect) {
      const startH = Math.min(dragStart.hour, dragCurrent.hour)
      const endH = Math.max(dragStart.hour, dragCurrent.hour)
      onTimeSelect(dragStart.day, startH, endH)
    }
    setDragStart(null)
    setDragCurrent(null)
  }

  // Очистка выделения, если мышь ушла за пределы таблицы
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (dragStart) {
        setDragStart(null)
        setDragCurrent(null)
      }
    }
    window.addEventListener('mouseup', handleGlobalMouseUp)
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp)
  }, [dragStart])

  const [scheduleMap, setScheduleMap] = useState<Record<string, ScheduleSlot>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (teacher?.alfacrmId) loadSchedule()
  }, [teacher.alfacrmId])

  // 🔥 Слушаем триггер обновления из родительского компонента
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

  const loadSchedule = async () => {
    setLoading(true)
    const data = await getTeacherSchedule(teacher.alfacrmId)
    if (data) setScheduleMap(data)
    setLoading(false)
  }

  const dynamicHours = useMemo(() => {
    if (!scheduleMap || Object.keys(scheduleMap).length === 0) {
      return Array.from({ length: 11 }, (_, i) => i + 9)
    }

    let minHour = 24
    let maxHour = 0

    Object.keys(scheduleMap).forEach((key) => {
      const hour = parseInt(key.split('-')[1], 10)
      if (hour < minHour) minHour = hour
      if (hour > maxHour) maxHour = hour
    })

    const startHour = Math.max(0, minHour - 1)
    const endHour = Math.min(23, maxHour + 1)

    return Array.from({ length: endHour - startHour + 1 }, (_, i) => i + startHour)
  }, [scheduleMap])

  const getSlot = (dayIndex: number, hour: number) => {
    return scheduleMap[`${dayIndex}-${hour}`]
  }


  return (
    <div
      className={cn(
        'w-full bg-background flex flex-col',
        isFullScreenLike ? 'flex-1 overflow-y-auto' : 'flex-none overflow-visible'
      )}
    >
      <AsyncView isLoading={loading} loader={<SkeletonSchedule />}>
        <div className="p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto space-y-6 w-full">
          {/* 🔥 Мы убрали кнопку отсюда и сверху */}
          <div className="w-full overflow-x-auto border border-border rounded-xl shadow-sm bg-card relative">
            <table className="min-w-[800px] w-full border-collapse">
              <thead>
                <tr>
                  <th className="sticky left-0 top-0 z-30 w-[95px] bg-muted/95 backdrop-blur-md p-3 border-b border-r border-border">
                    <Clock className="mx-auto h-4 w-4 text-muted-foreground" />
                  </th>
                  {DAYS.map((day, i) => (
                    <th
                      key={day}
                      className={`p-3 text-center border-b border-border sticky top-0 z-20 ${i >= 5 ? 'bg-muted/50 text-muted-foreground' : 'bg-muted/80 text-foreground'}`}
                    >
                      <div className="text-sm font-bold">{day}</div>
                      <div className="text-[10px] font-normal text-muted-foreground">
                        {FULL_DAYS[i]}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
              {dynamicHours.map((hour) => (
                <tr key={hour} className="group">
                  {/* ... Колонка времени без изменений ... */}

                  {DAYS.map((_, dayIndex) => {
                    const slot = getSlot(dayIndex, hour)

                    // 🔥 Проверяем, выделена ли эта ячейка прямо сейчас
                    const isSelected = dragStart && dragCurrent &&
                      dayIndex === dragStart.day &&
                      hour >= Math.min(dragStart.hour, dragCurrent.hour) &&
                      hour <= Math.max(dragStart.hour, dragCurrent.hour)

                    return (
                      <td
                        key={`${dayIndex}-${hour}`}
                        onMouseDown={() => handleMouseDown(dayIndex, hour)}
                        onMouseEnter={() => handleMouseEnter(dayIndex, hour)}
                        onMouseUp={handleMouseUp}
                        className={cn(
                          'relative h-[80px] border-b border-r border-border p-0 min-w-[120px] align-top transition-colors',
                          isEditMode ? 'cursor-crosshair hover:bg-muted/50' : '',
                          isSelected ? 'bg-blue-500/20' : 'bg-card/40' // 🔥 Синий фон при выделении
                        )}
                      >
                        {/* ВАЖНО: Добавили pointer-events-none ко всем внутренним блокам, чтобы они не перехватывали мышь во время перетаскивания! */}
                        <div className="absolute inset-0 pointer-events-none">
                          {/* Сетка каждые 10 минут */}
                          <div className="absolute inset-0 flex flex-col z-0">
                            {[...Array(5)].map((_, i) => (
                              <div
                                key={i}
                                className="flex-1 border-b border-border/40 border-dashed"
                              />
                            ))}
                            <div className="flex-1" />
                          </div>

                          {slot?.workingSegments?.map((seg, idx) => {
                            const top = (seg.startMin / 60) * 100
                            const height = ((seg.endMin - seg.startMin) / 60) * 100
                            const isTop = seg.startMin > 0
                            const isBottom = seg.endMin < 60

                            return (
                              <div
                                key={`ws-${idx}`}
                                className={cn(
                                  'absolute left-0 right-0 bg-emerald-50/70 z-0',
                                  isTop && 'rounded-t-md border-t border-emerald-100/50',
                                  isBottom && 'rounded-b-md border-b border-emerald-100/50'
                                )}
                                style={{ top: `${top}%`, height: `${height}%` }}
                              />
                            )
                          })}

                          {slot?.lessons?.map((lesson, idx) => {
                            const top = (lesson.startMin / 60) * 100
                            const height = ((lesson.endMin - lesson.startMin) / 60) * 100
                            const isTop = lesson.startMin > 0
                            const isBottom = lesson.endMin < 60

                            return (
                              <div
                                key={`ls-${idx}`}
                                className={cn(
                                  'absolute left-[2px] right-[2px] bg-rose-100 border-l-[3px] border-l-rose-400 overflow-hidden flex flex-col p-1.5 z-10 shadow-sm',
                                  isTop &&
                                    'rounded-t-md border-t border-r border-rose-200 mt-[1px]',
                                  isBottom &&
                                    'rounded-b-md border-b border-r border-rose-200 mb-[1px]',
                                  !isTop && !isBottom && 'border-y-0 border-r border-rose-200'
                                )}
                                style={{ top: `${top}%`, height: `${height}%` }}
                                title={`${lesson.subject}\n${lesson.student}\n${lesson.timeFrom} - ${lesson.timeTo}`} // 🔥 Нативный тултип при наведении
                              >
                                {height > 20 && (
                                  <>
                                    <span className="text-[11px] font-semibold leading-tight text-rose-900 line-clamp-1">
                                      {lesson.subject}
                                    </span>
                                    {height >= 40 && (
                                      <div className="flex flex-col mt-0.5 opacity-80">
                                        {/* 🔥 Имя ученика теперь на отдельной строке с обрезкой */}
                                        <span className="text-[9px] font-medium text-rose-700 truncate w-full">
                                          {lesson.student}
                                        </span>
                                        <span className="text-[9px] font-bold text-rose-600 mt-0.5">
                                          {lesson.timeFrom} - {lesson.timeTo}
                                        </span>
                                      </div>
                                    )}
                                  </>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </td>
                    )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </AsyncView>
    </div>
  )
}

const SkeletonSchedule = () => {
  return (
    <div className="w-full h-[400px] p-4 ">
      <Skeleton className="flex flex-col justify-between w-full h-full">
        <Skeleton className="w-full h-[10%] mb-4 bg-gray-200" />
        <Skeleton className="w-full h-[10%] mb-4 bg-gray-200" />
        <Skeleton className="w-full h-[10%] mb-4 bg-gray-200" />
        <Skeleton className="w-full h-[10%] mb-4 bg-gray-200" />
        <Skeleton className="w-full h-[10%] mb-4 bg-gray-200" />
      </Skeleton>
    </div>
  )
}
