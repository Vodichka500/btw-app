import { Clock, Edit3 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import { DAYS, FULL_DAYS, Lesson, WorkingHour } from './types'

export function ScheduleTable({
  dynamicHours,
  renderCell
}: {
  dynamicHours: number[]
  renderCell: (dayIndex: number, hour: number) => React.ReactNode
}) {
  return (
    <div className="w-full overflow-x-auto border border-border rounded-xl shadow-sm bg-card relative select-none">
      <table className="min-w-200 w-full border-collapse">
        <thead>
          <tr>
            <th className="sticky left-0 top-0 z-30 w-24 bg-muted/95 backdrop-blur-md p-3 border-b border-r border-border">
              <Clock className="mx-auto h-4 w-4 text-muted-foreground" />
            </th>
            {DAYS.map((day, i) => (
              <th
                key={day}
                className={`p-3 text-center border-b border-border sticky top-0 z-20 ${i >= 5 ? 'bg-muted/50 text-muted-foreground' : 'bg-muted/80 text-foreground'}`}
              >
                <div className="text-sm font-bold">{day}</div>
                <div className="text-[10px] font-normal text-muted-foreground">{FULL_DAYS[i]}</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {dynamicHours.map((hour) => (
            <tr key={hour} className="group">
              <td className="sticky left-0 z-20 w-[95px] bg-background/95 backdrop-blur-md p-2 text-center align-top border-b border-r border-border">
                <div className="text-[11px] font-medium text-muted-foreground mt-1">
                  {`${hour.toString().padStart(2, '0')}:00 - ${(hour + 1).toString().padStart(2, '0')}:00`}
                </div>
              </td>
              {DAYS.map((_, dayIndex) => (
                <td
                  key={`${dayIndex}-${hour}`}
                  className="relative h-[80px] border-b border-r border-border p-0 min-w-[120px] align-top bg-card/40"
                >
                  <div className="absolute inset-0 flex flex-col z-0 pointer-events-none">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="flex-1 border-b border-border/40 border-dashed" />
                    ))}
                    <div className="flex-1" />
                  </div>
                  {renderCell(dayIndex, hour)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

interface WorkingHourBlockProps {
  wh: WorkingHour
  isEditable?: boolean
  onClick?: (e: React.MouseEvent) => void
  onMouseDown?: (e: React.MouseEvent) => void
}

export function WorkingHourBlock({
  wh,
  isEditable = false,
  onClick,
  onMouseDown
}: WorkingHourBlockProps) {
  const [startH, startM] = wh.timeFrom.split(':').map(Number)
  const [endH, endM] = wh.timeTo.split(':').map(Number)
  const top = (startM / 60) * 100
  const height = ((endH * 60 + endM - (startH * 60 + startM)) / 60) * 100

  return (
    <div
      className={cn(
        'absolute left-[2px] right-[4px] border-l-[3px] rounded-md border overflow-hidden flex flex-col p-1.5 shadow-sm group transition-colors',
        isEditable
          ? 'bg-green-400/20 border-l-green-500 border-green-500/30 pointer-events-auto cursor-pointer hover:bg-green-400/40 z-20'
          : 'bg-green-400/20 border-l-green-500 border-green-500/30 pointer-events-none z-0'
      )}
      style={{ top: `${top}%`, height: `${height}%` }}
      onClick={onClick}
      onMouseDown={onMouseDown}
    >
      <span className="text-[11px] font-semibold text-green-900 dark:text-green-100">
        Godziny pracy
      </span>
      <span className="text-[9px] font-medium text-green-800 dark:text-green-200">
        {wh.timeFrom} - {wh.timeTo}
      </span>
      {isEditable && (
        <Edit3 className="absolute top-1.5 right-1.5 h-3 w-3 text-green-700 opacity-0 group-hover:opacity-100 transition-opacity" />
      )}
    </div>
  )
}

export function LessonBlock({ lesson, isMuted = false }: { lesson: Lesson; isMuted?: boolean }) {
  const [startH, startM] = lesson.timeFrom.split(':').map(Number)
  const [endH, endM] = lesson.timeTo.split(':').map(Number)
  const top = (startM / 60) * 100
  const totalMinutes = endH * 60 + endM - (startH * 60 + startM)
  const height = (totalMinutes / 60) * 100

  return (
    <div
      className={cn(
        'absolute left-[2px] right-[4px] border-l-[3px] rounded-md border overflow-hidden flex flex-col p-1.5 shadow-sm',
        isMuted
          ? 'bg-slate-200 border-l-slate-400 border-slate-300 opacity-60 pointer-events-none z-0'
          : 'bg-rose-100 border-l-rose-500 border-rose-200 pointer-events-none z-10'
      )}
      style={{ top: `${top}%`, height: `${height}%` }}
      // Оставляем тултип с инфой в базовом режиме, а в muted делаем простую заглушку
      title={
        isMuted
          ? 'Zajęcia zaplanowane'
          : `${lesson.subject}\n${lesson.student || 'Bez ucznia'}\n${lesson.timeFrom} - ${lesson.timeTo}`
      }
    >
      {!isMuted && (
        <div className="flex flex-col h-full justify-start">
          <span
            className={cn(
              'font-semibold leading-tight line-clamp-1 text-rose-900',
              totalMinutes <= 30 ? 'text-[10px]' : 'text-[11px]'
            )}
          >
            {lesson.subject}
          </span>
          {totalMinutes > 30 && (
            <span className="text-[10px] truncate mt-0.5 text-rose-700">{lesson.student}</span>
          )}
          {totalMinutes >= 45 && (
            <span className="text-[9px] font-bold mt-auto pt-0.5 truncate text-rose-600">
              {lesson.timeFrom} - {lesson.timeTo}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

export const SkeletonSchedule = () => (
  <div className="w-full h-[400px] p-4">
    <Skeleton className="flex flex-col justify-between w-full h-full" />
  </div>
)
