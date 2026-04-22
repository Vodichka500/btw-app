import { z } from 'zod';
import { JsonValueSchema } from '../inputTypeSchemas/JsonValueSchema'
import { ReportStatusSchema } from '../inputTypeSchemas/ReportStatusSchema'

/////////////////////////////////////////
// STUDENT REPORT SCHEMA
/////////////////////////////////////////

export const StudentReportSchema = z.object({
  status: ReportStatusSchema,
  id: z.number().int(),
  cycleId: z.number().int(),
  studentId: z.number().int(),
  lessonsAttended: z.number().int(),
  groupName: z.string().nullable(),
  teacherId: z.number().int(),
  sendError: z.string().nullable(),
  sentAt: z.coerce.date().nullable(),
  canceledAt: z.coerce.date().nullable(),
  cancelReason: z.string().nullable(),
  templateSnapshot: JsonValueSchema,
  additionalText: z.string().nullable(),
  generatedText: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type StudentReport = z.infer<typeof StudentReportSchema>

export default StudentReportSchema;
