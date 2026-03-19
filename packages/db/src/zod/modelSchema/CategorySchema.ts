import { z } from 'zod';

/////////////////////////////////////////
// CATEGORY SCHEMA
/////////////////////////////////////////

export const CategorySchema = z.object({
  id: z.number().int(),
  name: z.string(),
  order: z.number().int(),
  parentId: z.number().int().nullable(),
  createdAt: z.coerce.date(),
  deletedAt: z.coerce.date().nullable(),
})

export type Category = z.infer<typeof CategorySchema>

export default CategorySchema;
