import { z } from 'zod';

/////////////////////////////////////////
// TEACHER SCHEMA
/////////////////////////////////////////

export const TeacherSchema = z.object({
  id: z.number().int(),
  alfacrmId: z.number().int(),
  name: z.string(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  note: z.string().nullable(),
})

export type Teacher = z.infer<typeof TeacherSchema>

export default TeacherSchema;
