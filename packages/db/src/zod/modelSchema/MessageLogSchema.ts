import { z } from 'zod';
import { MessageStatusSchema } from '../inputTypeSchemas/MessageStatusSchema'

/////////////////////////////////////////
// MESSAGE LOG SCHEMA
/////////////////////////////////////////

export const MessageLogSchema = z.object({
  status: MessageStatusSchema,
  id: z.number().int(),
  alfaId: z.number().int(),
  messageBody: z.string(),
  errorReason: z.string().nullable(),
  createdAt: z.coerce.date(),
})

export type MessageLog = z.infer<typeof MessageLogSchema>

export default MessageLogSchema;
