import { z } from 'zod';
import { RoleSchema } from '../inputTypeSchemas/RoleSchema'

/////////////////////////////////////////
// USER SCHEMA
/////////////////////////////////////////

export const UserSchema = z.object({
  role: RoleSchema,
  id: z.string().cuid(),
  email: z.string(),
  name: z.string().nullable(),
  emailVerified: z.boolean(),
  image: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  alfaEmail: z.string().nullable(),
  alfaToken: z.string().nullable(),
  tgChatId: z.string().nullable(),
  teacherId: z.number().int().nullable(),
})

export type User = z.infer<typeof UserSchema>

export default UserSchema;
