import { z } from 'zod';

/////////////////////////////////////////
// REPORT CRITERION SCHEMA
/////////////////////////////////////////

export const ReportCriterionSchema = z.object({
  id: z.number().int(),
  templateId: z.number().int(),
  name: z.string(),
  tag: z.string(),
  options: z.string().array(),
})

export type ReportCriterion = z.infer<typeof ReportCriterionSchema>

export default ReportCriterionSchema;
