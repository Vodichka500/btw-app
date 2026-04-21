import { z } from 'zod';

/////////////////////////////////////////
// REPORT SETTINGS SCHEMA
/////////////////////////////////////////

export const ReportSettingsSchema = z.object({
  id: z.number().int(),
  deadlineDays: z.number().int(),
  defaultReminderText: z.string(),
})

export type ReportSettings = z.infer<typeof ReportSettingsSchema>

export default ReportSettingsSchema;
