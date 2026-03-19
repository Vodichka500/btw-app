import { z } from 'zod';

export const SnippetScalarFieldEnumSchema = z.enum(['id','title','body','variables','categoryId','favorite','color','order','createdAt','updatedAt','deletedAt']);

export default SnippetScalarFieldEnumSchema;
