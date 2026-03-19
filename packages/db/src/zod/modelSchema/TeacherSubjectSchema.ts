import { z } from 'zod';

/////////////////////////////////////////
// TEACHER SUBJECT SCHEMA
/////////////////////////////////////////

export const TeacherSubjectSchema = z.object({
  teacherId: z.number().int(),
  subjectId: z.number().int(),
})

export type TeacherSubject = z.infer<typeof TeacherSubjectSchema>

export default TeacherSubjectSchema;
