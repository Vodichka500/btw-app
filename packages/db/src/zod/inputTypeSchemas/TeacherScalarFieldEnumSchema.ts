import { z } from 'zod';

export const TeacherScalarFieldEnumSchema = z.enum(['id','alfacrmId','name','email','phone','avatarUrl','note']);

export default TeacherScalarFieldEnumSchema;
