import { z } from 'zod';
import { ReportCriterionTypeSchema } from '../inputTypeSchemas/ReportCriterionTypeSchema'

/////////////////////////////////////////
// REPORT CRITERION SCHEMA
/////////////////////////////////////////

export const ReportCriterionSchema = z.object({
  type: ReportCriterionTypeSchema,
  id: z.number().int(),
  templateId: z.number().int(),
  name: z.string(),
  tag: z.string(),
  required: z.boolean(),
  options: z.string().array(),
})

export type ReportCriterion = z.infer<typeof ReportCriterionSchema>

export default ReportCriterionSchema;
