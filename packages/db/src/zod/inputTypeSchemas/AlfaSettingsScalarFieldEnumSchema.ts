import { z } from 'zod';

export const AlfaSettingsScalarFieldEnumSchema = z.enum(['id','email','apiKey','token','tokenExpiresAt']);

export default AlfaSettingsScalarFieldEnumSchema;
