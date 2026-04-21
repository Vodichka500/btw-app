import { z } from 'zod';

export const ReportSettingsScalarFieldEnumSchema = z.enum(['id','deadlineDays','defaultReminderText']);

export default ReportSettingsScalarFieldEnumSchema;
