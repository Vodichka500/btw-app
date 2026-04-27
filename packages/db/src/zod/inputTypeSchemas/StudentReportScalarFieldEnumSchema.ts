import { z } from 'zod';

export const StudentReportScalarFieldEnumSchema = z.enum(['id','cycleId','studentId','lessonsAttended','groupName','alfaSubjectId','teacherId','status','sendError','sentAt','canceledAt','cancelReason','templateSnapshot','additionalText','generatedText','createdAt','updatedAt']);

export default StudentReportScalarFieldEnumSchema;
