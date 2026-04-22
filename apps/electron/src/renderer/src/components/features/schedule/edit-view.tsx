import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { trpc } from '@/lib/trpc'
import { cn } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/shared/ui/dialog'
import { Button } from '@/components/shared/ui/button'
import { Input } from '@/components/shared/ui/input'
import { Label } from '@/components/shared/ui/label'
import { toast } from 'sonner'
import { FULL_DAYS, Lesson, WorkingHour } from './types'
import { ScheduleTable, LessonBlock, WorkingHourBlock } from './schedule-ui'

type EditModalState =
  | { mode: 'create'; dayIndex: number; timeFrom: string; timeTo: string }
  | { mode: 'edit'; id: number; dayIndex: number; timeFrom: string; timeTo: string }
  | null

export function EditWorkingHourView({
  data,
  dynamicHours,
  teacherId,
  onRefresh
}: {
  data: any
  dynamicHours: number[]
  teacherId: number
  onRefresh: () => void
}) {
  // 🔥 1. Инициализируем tRPC мутации
  const createWorkingHourMutation = trpc.teachers.createWorkingHour.useMutation({
    onSuccess: () => {
      setEditState(null)
      onRefresh()
      toast.success('Godziny zapisane pomyślnie')
    },
    onError: (e) => toast.error(e.message || 'Błąd zapisu')
  })

  const updateWorkingHourMutation = trpc.teachers.updateWorkingHour.useMutation({
    onSuccess: () => {
      setEditState(null)
      onRefresh()
      toast.success('Godziny zapisane pomyślnie')
    },
    onError: (e) => toast.error(e.message || 'Błąd zapisu')
  })

  const deleteWorkingHourMutation = trpc.teachers.deleteWorkingHour.useMutation({
    onSuccess: () => {
      setEditState(null)
      onRefresh()
      toast.success('Usunięto pomyślnie')
    },
    onError: (e) => toast.error(e.message || 'Błąd usuwania')
  })

  // Вычисляем общий статус загрузки для блокировки кнопок
  const isSaving =
    createWorkingHourMutation.isPending ||
    updateWorkingHourMutation.isPending ||
    deleteWorkingHourMutation.isPending

  const [dragStart, setDragStart] = useState<{ day: number; hour: number } | null>(null)
  const [dragCurrent, setDragCurrent] = useState<{ day: number; hour: number } | null>(null)
  const [editState, setEditState] = useState<EditModalState>(null)

  const handleMouseUp = () => {
    if (dragStart && dragCurrent) {
      const startH = Math.min(dragStart.hour, dragCurrent.hour)
      const endH = Math.max(dragStart.hour, dragCurrent.hour)
      setEditState({
        mode: 'create',
        dayIndex: dragStart.day,
        timeFrom: `${startH.toString().padStart(2, '0')}:00`,
        timeTo: `${(endH + 1).toString().padStart(2, '0')}:00`
      })
    }
    setDragStart(null)
    setDragCurrent(null)
  }

  // 🔥 2. Обновляем обработчик сохранения
  const handleSave = () => {
    if (!editState) return

    if (editState.mode === 'create') {
      createWorkingHourMutation.mutate({
        teacherId,
        dayIndex: editState.dayIndex,
        timeFrom: editState.timeFrom,
        timeTo: editState.timeTo
      })
    } else {
      updateWorkingHourMutation.mutate({
        id: editState.id,
        timeFrom: editState.timeFrom,
        timeTo: editState.timeTo
      })
    }
  }

  // 🔥 3. Обновляем обработчик удаления
  const handleDelete = () => {
    if (editState?.mode !== 'edit') return
    deleteWorkingHourMutation.mutate(editState.id) // Передаем ID или объект в зависимости от схемы твоего роутера
  }

  return (
    <>
      <ScheduleTable
        dynamicHours={dynamicHours}
        renderCell={(dayIndex, hour) => {
          const rawLessons = data.lessonsMap[`${dayIndex}-${hour}`] || []

          const lessons = rawLessons.filter((ls: Lesson) => {
            const startH = parseInt(ls.timeFrom.split(':')[0], 10)
            return startH === hour
          })
          const hours = data.workingHours.filter(
            (wh: WorkingHour) =>
              parseInt(wh.timeFrom.split(':')[0], 10) === hour && wh.dayIndex === dayIndex
          )

          const isDraggingThisCell =
            dragStart &&
            dragCurrent &&
            dayIndex === dragStart.day &&
            hour >= Math.min(dragStart.hour, dragCurrent.hour) &&
            hour <= Math.max(dragStart.hour, dragCurrent.hour)

          return (
            <div
              className={cn(
                'absolute inset-0 z-0 transition-colors',
                isDraggingThisCell ? 'bg-blue-500/20' : 'hover:bg-muted/50 cursor-crosshair'
              )}
              onMouseDown={() => {
                setDragStart({ day: dayIndex, hour })
                setDragCurrent({ day: dayIndex, hour })
              }}
              onMouseEnter={() => {
                if (dragStart && dragStart.day === dayIndex) setDragCurrent({ day: dayIndex, hour })
              }}
              onMouseUp={handleMouseUp}
            >
              {lessons.map((ls: Lesson, idx: number) => (
                <LessonBlock key={`l-${idx}`} lesson={ls} isMuted />
              ))}

              {hours.map((wh: WorkingHour) => (
                <WorkingHourBlock
                  key={`w-${wh.id}`}
                  wh={wh}
                  isEditable
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation()
                    setEditState({
                      mode: 'edit',
                      id: wh.id,
                      dayIndex: wh.dayIndex,
                      timeFrom: wh.timeFrom,
                      timeTo: wh.timeTo
                    })
                  }}
                />
              ))}
            </div>
          )
        }}
      />

      {/* Модалка редактирования без изменений, кроме снятия ручного try/catch */}
      <Dialog open={!!editState} onOpenChange={(open) => !open && !isSaving && setEditState(null)}>
        <DialogContent className="sm:max-w-[400px] text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-950">
          <DialogHeader>
            <DialogTitle>
              {editState?.mode === 'create' ? 'Dodaj godziny pracy' : 'Edytuj godziny pracy'}
            </DialogTitle>
          </DialogHeader>

          {editState && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label className="text-slate-900 dark:text-slate-100">Dzień tygodnia</Label>
                <Input
                  value={FULL_DAYS[editState.dayIndex]}
                  disabled
                  className="bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100 border-slate-200 dark:border-slate-700"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label className="text-slate-900 dark:text-slate-100">Od (HH:MM)</Label>
                  <Input
                    type="time"
                    value={editState.timeFrom}
                    onChange={(e) => setEditState({ ...editState, timeFrom: e.target.value })}
                    className="text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-700"
                  />
                </div>
                <div className="grid gap-2">
                  <Label className="text-slate-900 dark:text-slate-100">Do (HH:MM)</Label>
                  <Input
                    type="time"
                    value={editState.timeTo}
                    onChange={(e) => setEditState({ ...editState, timeTo: e.target.value })}
                    className="text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-700"
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex w-full sm:justify-between">
            {editState?.mode === 'edit' ? (
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isSaving}
                className="text-white"
              >
                <Trash2 className="h-4 w-4 mr-2" /> Usuń
              </Button>
            ) : (
              <div />
            )}
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setEditState(null)}
                disabled={isSaving}
                className="text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-700"
              >
                Anuluj
              </Button>
              <Button
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={handleSave}
                disabled={isSaving}
              >
                Zapisz
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
