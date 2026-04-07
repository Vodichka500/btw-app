import { z } from 'zod';

/////////////////////////////////////////
// BILLING TEMPLATE SCHEMA
/////////////////////////////////////////

export const BillingTemplateSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  body: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type BillingTemplate = z.infer<typeof BillingTemplateSchema>

export default BillingTemplateSchema;
