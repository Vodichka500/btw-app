import { z } from 'zod';

export const ReportCriterionTypeSchema = z.enum(['SELECT','TEXT']);

export type ReportCriterionTypeType = `${z.infer<typeof ReportCriterionTypeSchema>}`

export default ReportCriterionTypeSchema;
