export const DAYS = ['PN', 'WT', 'ŚR', 'CZ', 'PT', 'SO', 'ND']
export const FULL_DAYS = [
  'Poniedziałek',
  'Wtorek',
  'Środa',
  'Czwartek',
  'Piątek',
  'Sobota',
  'Niedziela'
]

export interface Lesson {
  subject: string
  student?: string
  timeFrom: string
  timeTo: string
  startMin: number
  endMin: number
}

export interface WorkingHour {
  id: number
  dayIndex: number
  timeFrom: string
  timeTo: string
}

export interface TeacherScheduleProps {
  teacher: { id: number; alfacrmId: number; name: string }
  isFullScreenLike?: boolean
  refreshTrigger: number
  onRefreshingChange: (isRefreshing: boolean) => void
  isEditMode?: boolean
}
