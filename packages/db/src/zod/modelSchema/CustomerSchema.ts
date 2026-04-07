import { z } from 'zod';

/////////////////////////////////////////
// CUSTOMER SCHEMA
/////////////////////////////////////////

export const CustomerSchema = z.object({
  id: z.number().int(),
  alfaId: z.number().int(),
  isSelfPaid: z.boolean(),
  name: z.string(),
  studentTgChatId: z.string().nullable(),
  parentTgChatId: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type Customer = z.infer<typeof CustomerSchema>

export default CustomerSchema;
