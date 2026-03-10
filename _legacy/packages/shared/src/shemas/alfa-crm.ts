import { z } from 'zod'
import { TeacherSchema } from '../zod/base'

export const AlfaCrmAuthSchema = z.object({
  email: z.string().email('Введите корректный email адрес'),
  apiKey: z.string().min(1, 'API ключ обязателен для заполнения')
})
export type AlfaCrmAuthInput = z.infer<typeof AlfaCrmAuthSchema>

export const AlfaCrmAuthResponseSchema = z.object({
  token: z.string(),
})
export type AlfaCrmAuthResponse = z.infer<typeof AlfaCrmAuthResponseSchema>

export type AlfaUserInfoResponse = {
  items: {
    id: number
  }[]
}

export type GetTeachersRequest = {
  // 0 - активный, 1 - удаленный
  removed?: 0 | 1
  page?: number
}

export type AlfaTeacher = {
  id: number
  name: string
  email: string[]
  avatarUrl: string,
  phone: string
  note: string
}

export type GetTeachersAlfaResponse = {
  total: number
  count: number
  page: number
  items: AlfaTeacher[]
}



export type isAuthResponse = {
  isAuth: boolean
}

export type UpdateTeachersResponse = {
  status: string;
  added: number;
  updated: number;
  total: number
}

export type GeneralIndexedResponse<T> = {
  total: number
  count: number
  page: number
  items: T[]
}

export type WorkingHours = {
  id: number,
  weekday: number,
  time_from: string,
  time_to: string,
  teacher_id: number,
}

export type ScheduleLesson = {
  id: number
  lesson_type_id: number
  related_class: string
  related_id: number
  subject_id: number
  streaming: boolean
  teacher_ids: number[]
  room_id: number | null
  day: number
  days: number[]
  time_from_v: string
  time_to_v: string
  e_date_v: string
  b_date_v: string
  b_date: string
  e_date: string
  is_public: number
  customer_limit: number | null
}

export type AlfaSubject = {
  id: number
  name: string
  weight: number
}


export type TimeSegment = {
  startMin: number
  endMin: number
}

export type ScheduleLessonDetail = {
  subject: string
  student?: string
  timeFrom: string
  timeTo: string
  startMin: number
  endMin: number
}

export type ScheduleSlot = {
  workingSegments: TimeSegment[]
  lessons: ScheduleLessonDetail[]
}

// Итоговая мапа
export type TeacherScheduleMap = Record<string, ScheduleSlot>



export type ModifyWorkingHourInput = {
  teacherId: number
  action: 'add' | 'remove'
  weekday: number // 1-7 (формат AlfaCRM, где 1 - это Вс)
  timeFrom: string // "HH:MM"
  timeTo: string // "HH:MM"
}

export const TeacherCreateSchema = TeacherSchema.omit({ id: true })
export type TeacherCreateInput = z.infer<typeof TeacherCreateSchema>

export const TeacherUpdateSchema = TeacherCreateSchema.partial().extend({
  id: z.number()
})
export type TeacherUpdateInput = z.infer<typeof TeacherUpdateSchema>