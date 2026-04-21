import { z } from 'zod';

/////////////////////////////////////////
// REPORT CYCLE SCHEMA
/////////////////////////////////////////

export const ReportCycleSchema = z.object({
  id: z.number().int(),
  label: z.string().nullable(),
  periodStart: z.coerce.date(),
  periodEnd: z.coerce.date(),
  isArchived: z.boolean(),
  createdAt: z.coerce.date(),
  missingTeachers: z.number().int().array(),
  missingCustomers: z.number().int().array(),
})

export type ReportCycle = z.infer<typeof ReportCycleSchema>

export default ReportCycleSchema;
