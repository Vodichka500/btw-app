import { z } from 'zod';
import { MessageStatusSchema } from '../inputTypeSchemas/MessageStatusSchema'

/////////////////////////////////////////
// BILLING LOG SCHEMA
/////////////////////////////////////////

export const BillingLogSchema = z.object({
  status: MessageStatusSchema,
  id: z.number().int(),
  alfaId: z.number().int(),
  month: z.number().int(),
  year: z.number().int(),
  amountCalculated: z.number(),
  messageBody: z.string(),
  sentAt: z.coerce.date(),
})

export type BillingLog = z.infer<typeof BillingLogSchema>

export default BillingLogSchema;
