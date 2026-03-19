import { z } from 'zod';

export const TeacherSubjectScalarFieldEnumSchema = z.enum(['teacherId','subjectId']);

export default TeacherSubjectScalarFieldEnumSchema;
