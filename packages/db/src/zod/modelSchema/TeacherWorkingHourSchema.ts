import { z } from 'zod';

/////////////////////////////////////////
// TEACHER WORKING HOUR SCHEMA
/////////////////////////////////////////

export const TeacherWorkingHourSchema = z.object({
  id: z.number().int(),
  teacherId: z.number().int(),
  dayIndex: z.number().int(),
  timeFrom: z.string(),
  timeTo: z.string(),
})

export type TeacherWorkingHour = z.infer<typeof TeacherWorkingHourSchema>

export default TeacherWorkingHourSchema;
