import { z } from 'zod';

export const ReportCriterionScalarFieldEnumSchema = z.enum(['id','templateId','name','tag','options']);

export default ReportCriterionScalarFieldEnumSchema;
