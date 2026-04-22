import { z } from 'zod';

/////////////////////////////////////////
// TELEGRAM SESSION SCHEMA
/////////////////////////////////////////

export const TelegramSessionSchema = z.object({
  id: z.number().int(),
  phoneNumber: z.string().nullable(),
  sessionString: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type TelegramSession = z.infer<typeof TelegramSessionSchema>

export default TelegramSessionSchema;
