import { z } from 'zod';

/////////////////////////////////////////
// BILLING LOG SCHEMA
/////////////////////////////////////////

export const BillingLogSchema = z.object({
  id: z.number().int(),
  alfaId: z.number().int(),
  month: z.number().int(),
  year: z.number().int(),
  amountCalculated: z.number(),
  messageBody: z.string(),
  sentAt: z.coerce.date(),
  status: z.string(),
})

export type BillingLog = z.infer<typeof BillingLogSchema>

export default BillingLogSchema;
