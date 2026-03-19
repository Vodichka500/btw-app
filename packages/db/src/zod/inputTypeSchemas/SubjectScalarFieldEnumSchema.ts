import { z } from 'zod';

export const SubjectScalarFieldEnumSchema = z.enum(['id','alfacrmId','name','order']);

export default SubjectScalarFieldEnumSchema;
