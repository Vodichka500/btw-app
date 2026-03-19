import { z } from 'zod';

export const TeacherWorkingHourScalarFieldEnumSchema = z.enum(['id','teacherId','dayIndex','timeFrom','timeTo']);

export default TeacherWorkingHourScalarFieldEnumSchema;
