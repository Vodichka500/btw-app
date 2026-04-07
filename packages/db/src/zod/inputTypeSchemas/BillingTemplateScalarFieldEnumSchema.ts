import { z } from 'zod';

export const BillingTemplateScalarFieldEnumSchema = z.enum(['id','name','body','createdAt','updatedAt']);

export default BillingTemplateScalarFieldEnumSchema;
