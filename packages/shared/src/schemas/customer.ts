import { z } from "zod";

// CUSTOMER SETTINGS
export const UpdateCustomerSettingsSchema = z.object({
  id: z.number().int(), // Наш внутренний ID из базы
  isSelfPaid: z.boolean(),
  studentTgChatId: z.string().nullable(),
  parentTgChatId: z.string().nullable(),
});

export type UpdateCustomerSettingsInput = z.infer<typeof UpdateCustomerSettingsSchema>;

// Тип пропсов для фронта (включает имя только для отрисовки)
export type CustomerSettingsRow = UpdateCustomerSettingsInput & {
  name: string;
};

// CUSTOMER SYNC
export const SynchronizeCustomersInputSchema = z.object({
  customers: z.array(
    z.object({
      alfaId: z.number().int(),
      name: z.string(),
    }),
  ),
});

export type SynchronizeCustomersInput = z.infer<
  typeof SynchronizeCustomersInputSchema
>;

// GET CUSTOMERS
export const GetSavedCustomersInputSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(50),
  search: z.string().optional(),
});

export type GetSavedCustomersInput = z.infer<
  typeof GetSavedCustomersInputSchema
>;
