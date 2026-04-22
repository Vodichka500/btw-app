import { z } from "zod";
import { CustomerSchema } from "@btw-app/db/zod";


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
      teacherIds: z.array(z.number().int()).default([]),
      isStudy: z.number().int().default(1),
      isRemoved: z.boolean().default(false),
      customClass: z.string().nullable().default(null),
    }),
  ),
});

export type SynchronizeCustomersInput = z.infer<
  typeof SynchronizeCustomersInputSchema
>;

export const UpdateCustomerNoteSchema = z.object({
  id: z.number().int(),
  note: z.string().nullable(),
});

// GET CUSTOMERS
export const GetSavedCustomersInputSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(50),
  search: z.string().optional(),
  customClass: z.string().optional(),
  teacherId: z.number().optional(),
  isRemoved: z.boolean().optional(),
  noClass: z.boolean().optional(),
  noTeachers: z.boolean().optional(),
});

export type GetSavedCustomersInput = z.infer<
  typeof GetSavedCustomersInputSchema
>;


export type Customer = z.infer<typeof CustomerSchema>