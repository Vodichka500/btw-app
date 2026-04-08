import { z } from 'zod';

export const CustomerScalarFieldEnumSchema = z.enum(['id','alfaId','isSelfPaid','name','teacherIds','isStudy','isRemoved','note','studentTgChatId','parentTgChatId','createdAt','updatedAt']);

export default CustomerScalarFieldEnumSchema;
