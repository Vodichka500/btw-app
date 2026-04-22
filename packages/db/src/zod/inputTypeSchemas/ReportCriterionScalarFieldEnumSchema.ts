import { z } from 'zod';

export const ReportCriterionScalarFieldEnumSchema = z.enum(['id','templateId','name','tag','type']);

export default ReportCriterionScalarFieldEnumSchema;
