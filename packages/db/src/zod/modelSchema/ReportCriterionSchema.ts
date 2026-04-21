import { z } from 'zod';
import { CriterionTypeSchema } from '../inputTypeSchemas/CriterionTypeSchema'

/////////////////////////////////////////
// REPORT CRITERION SCHEMA
/////////////////////////////////////////

export const ReportCriterionSchema = z.object({
  type: CriterionTypeSchema,
  id: z.number().int(),
  templateId: z.number().int(),
  name: z.string(),
  tag: z.string(),
})

export type ReportCriterion = z.infer<typeof ReportCriterionSchema>

export default ReportCriterionSchema;
