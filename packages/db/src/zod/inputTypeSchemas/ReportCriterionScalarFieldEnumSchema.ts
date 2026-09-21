import { z } from 'zod';

export const ReportCriterionScalarFieldEnumSchema = z.enum(['id','templateId','name','tag','type','required','options']);

export default ReportCriterionScalarFieldEnumSchema;
