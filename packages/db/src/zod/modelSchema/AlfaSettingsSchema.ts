import { z } from 'zod';

/////////////////////////////////////////
// ALFA SETTINGS SCHEMA
/////////////////////////////////////////

export const AlfaSettingsSchema = z.object({
  id: z.number().int(),
  email: z.string(),
  apiKey: z.string(),
  token: z.string().nullable(),
  tokenExpiresAt: z.coerce.date().nullable(),
})

export type AlfaSettings = z.infer<typeof AlfaSettingsSchema>

export default AlfaSettingsSchema;
