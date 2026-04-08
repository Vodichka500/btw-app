import { z } from 'zod';

export const MessageLogScalarFieldEnumSchema = z.enum(['id','alfaId','messageBody','status','errorReason','createdAt']);

export default MessageLogScalarFieldEnumSchema;
