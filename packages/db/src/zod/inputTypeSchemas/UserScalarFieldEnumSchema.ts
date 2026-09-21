import { z } from 'zod';

export const UserScalarFieldEnumSchema = z.enum(['id','email','name','emailVerified','image','createdAt','updatedAt','birthDate','role','alfaEmail','alfaToken','tgChatId','teacherId']);

export default UserScalarFieldEnumSchema;
