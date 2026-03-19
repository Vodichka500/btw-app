import { z } from 'zod';
import { JsonValueSchema } from '../inputTypeSchemas/JsonValueSchema'

/////////////////////////////////////////
// SNIPPET SCHEMA
/////////////////////////////////////////

export const SnippetSchema = z.object({
  id: z.number().int(),
  title: z.string(),
  body: z.string(),
  variables: JsonValueSchema.nullable(),
  categoryId: z.number().int(),
  favorite: z.boolean(),
  color: z.string().nullable(),
  order: z.number().int(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  deletedAt: z.coerce.date().nullable(),
})

export type Snippet = z.infer<typeof SnippetSchema>

export default SnippetSchema;
