import { z } from 'zod';

export const TelegramSessionScalarFieldEnumSchema = z.enum(['id','phoneNumber','sessionString','createdAt','updatedAt']);

export default TelegramSessionScalarFieldEnumSchema;
