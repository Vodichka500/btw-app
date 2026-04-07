import { z } from 'zod';

export const SyncStateScalarFieldEnumSchema = z.enum(['type','syncedAt']);

export default SyncStateScalarFieldEnumSchema;
