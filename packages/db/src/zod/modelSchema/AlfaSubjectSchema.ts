import { z } from 'zod';

/////////////////////////////////////////
// ALFA SUBJECT SCHEMA
/////////////////////////////////////////

export const AlfaSubjectSchema = z.object({
  id: z.number().int(),
  alfaId: z.number().int(),
  name: z.string(),
})

export type AlfaSubject = z.infer<typeof AlfaSubjectSchema>

export default AlfaSubjectSchema;
