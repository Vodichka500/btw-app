import { z } from 'zod';

export const BillingLogScalarFieldEnumSchema = z.enum(['id','alfaId','month','year','amountCalculated','messageBody','sentAt','status']);

export default BillingLogScalarFieldEnumSchema;
