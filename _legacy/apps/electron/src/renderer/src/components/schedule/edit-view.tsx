import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { useAlfaCrm } from '@/hooks/use-alfa-crm'
import { cn } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
  const { createWorkingHour, updateWorkingHour, deleteWorkingHour } = useAlfaCrm()

  const [dragStart, setDragStart] = useState<{ day: number; hour: number } | null>(null)
  const [dragCurrent, setDragCurrent] = useState<{ day: number; hour: number } | null>(null)

  const [editState, setEditState] = useState<EditModalState>(null)
  const [isSaving, setIsSaving] = useState(false)

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

  const handleSave = async () => {
    if (!editState) return
    setIsSaving(true)
    try {
      if (editState.mode === 'create') {
        const res = await createWorkingHour({
          teacherId,
          dayIndex: editState.dayIndex,
          timeFrom: editState.timeFrom,
          timeTo: editState.timeTo
        })
        if (!res.success) throw new Error(res.error)
      } else {
        const res = await updateWorkingHour({
          id: editState.id,
          timeFrom: editState.timeFrom,
          timeTo: editState.timeTo
        })
        if (!res.success) throw new Error(res.error)
      }
      setEditState(null)
      onRefresh()
      toast.success('Godziny zapisane pomyślnie')
    } catch (e: any) {
      toast.error(e.message || 'Błąd zapisu')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (editState?.mode !== 'edit') return
    setIsSaving(true)
    try {
      const res = await deleteWorkingHour(editState.id)
      if (!res.success) throw new Error(res.error)
      setEditState(null)
      onRefresh()
      toast.success('Usunięto pomyślnie')
    } catch (e: any) {
      toast.error(e.message || 'Błąd usuwania')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <>
      <ScheduleTable
        dynamicHours={dynamicHours}
        renderCell={(dayIndex, hour) => {
          const lessons = data.lessonsMap[`${dayIndex}-${hour}`] || []
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
