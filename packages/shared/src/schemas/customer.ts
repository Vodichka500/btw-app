import { z } from "zod";
import { CustomerSchema } from "@btw-app/db/zod";

export const UpdateCustomerSettingsSchema = CustomerSchema.extend({
  alfaId: z.number().int(),
  isSelfPaid: z.boolean(),
  studentTgChatId: z.string().nullable().optional(),
  parentTgChatId: z.string().nullable().optional(),
});

export type UpdateCustomerSettingsInput = z.infer<
  typeof UpdateCustomerSettingsSchema
>;

export type CustomerType = z.infer<typeof CustomerSchema>;
