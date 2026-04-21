import { z } from 'zod';

/////////////////////////////////////////
// REPORT TEMPLATE SCHEMA
/////////////////////////////////////////

export const ReportTemplateSchema = z.object({
  id: z.number().int(),
  body: z.string(),
})

export type ReportTemplate = z.infer<typeof ReportTemplateSchema>

export default ReportTemplateSchema;
