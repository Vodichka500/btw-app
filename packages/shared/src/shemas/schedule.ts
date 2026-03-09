import { Subject, SubjectSchema, Teacher, TeacherWorkingHoursSchema } from '../zod/base'
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


export const ModifyWorkingHourLocalInputSchema = TeacherWorkingHoursSchema.pick({
  teacherId: true,
  dayIndex: true,
  timeFrom: true,
  timeTo: true,
}).extend({
  action: z.enum(["add", "remove"])
})

export type ModifyWorkingHourLocalInput = z.infer<typeof ModifyWorkingHourLocalInputSchema>