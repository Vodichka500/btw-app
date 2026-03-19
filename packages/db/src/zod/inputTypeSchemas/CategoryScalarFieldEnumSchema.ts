import { z } from 'zod';

export const CategoryScalarFieldEnumSchema = z.enum(['id','name','order','parentId','createdAt','deletedAt']);

export default CategoryScalarFieldEnumSchema;
