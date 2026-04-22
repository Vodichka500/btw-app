import { z } from 'zod';

export const ReportStatusSchema = z.enum(['PENDING','SENT','CANCELED','FAILED']);

export type ReportStatusType = `${z.infer<typeof ReportStatusSchema>}`

export default ReportStatusSchema;
