import { z } from 'zod';

export const UserScalarFieldEnumSchema = z.enum(['id','email','name','emailVerified','image','createdAt','updatedAt','role','alfaEmail','alfaToken','tgChatId']);

export default UserScalarFieldEnumSchema;
