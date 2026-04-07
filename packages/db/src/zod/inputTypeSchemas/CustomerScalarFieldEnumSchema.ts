import { z } from 'zod';

export const CustomerScalarFieldEnumSchema = z.enum(['id','alfaId','isSelfPaid','name','studentTgChatId','parentTgChatId','createdAt','updatedAt']);

export default CustomerScalarFieldEnumSchema;
