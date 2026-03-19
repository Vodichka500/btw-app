import { z } from 'zod';

/////////////////////////////////////////
// SUBJECT SCHEMA
/////////////////////////////////////////

export const SubjectSchema = z.object({
  id: z.number().int(),
  alfacrmId: z.number().int().nullable(),
  name: z.string(),
  order: z.number().int(),
})

export type Subject = z.infer<typeof SubjectSchema>

export default SubjectSchema;
