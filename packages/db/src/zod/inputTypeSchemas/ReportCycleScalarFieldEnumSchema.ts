import { z } from 'zod';

export const ReportCycleScalarFieldEnumSchema = z.enum(['id','label','periodStart','periodEnd','isArchived','createdAt','missingTeachers','missingCustomers']);

export default ReportCycleScalarFieldEnumSchema;
