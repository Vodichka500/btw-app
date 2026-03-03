import { Subject, SubjectSchema, Teacher } from '../zod/base'
import { z } from 'zod'

export const CreateSubjectSchema = SubjectSchema
  .pick({
    name: true
  })
export type CreateSubject = z.infer<typeof CreateSubjectSchema>

export const UpdateSubjectSchema = SubjectSchema
  .pick({
    id: true,
    name: true
  })
export type UpdateSubject = z.infer<typeof UpdateSubjectSchema>

export type SubjectWithTeachers = Subject & { teachers: Teacher[] }
export type ScheduleDataResponse = {
  subjects: SubjectWithTeachers[]
  unassignedTeachers: Teacher[]
}