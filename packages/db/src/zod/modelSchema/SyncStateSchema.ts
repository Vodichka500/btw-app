import { z } from 'zod';

/////////////////////////////////////////
// SYNC STATE SCHEMA
/////////////////////////////////////////

export const SyncStateSchema = z.object({
  type: z.string(),
  syncedAt: z.coerce.date(),
})

export type SyncState = z.infer<typeof SyncStateSchema>

export default SyncStateSchema;
