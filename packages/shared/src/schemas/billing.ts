import { BillingLogSchema, BillingTemplateSchema } from "@btw-app/db/zod";
import { z } from "zod";

// BILLING TEMPLATE SCHEMAS
export const CreateBillingTemplateSchema = BillingTemplateSchema.pick({
  name: true,
  body: true,
}).extend({
  name: z.string().min(1, "Nazwa szablonu nie może być pusta"),
  body: z.string().min(1, "Treść szablonu nie może być pusta"),
});

export const UpdateBillingTemplateSchema =
  CreateBillingTemplateSchema.partial().extend({
    id: z.number().int(),
  });

export type CreateTemplateInput = z.infer<typeof CreateBillingTemplateSchema>;
export type UpdateTemplateInput = z.infer<typeof UpdateBillingTemplateSchema>;

// BILLING LOG SCHEMAS
export const GetBillingLogsInputSchema = z.object({
  month: z.number().int().min(0).max(11),
  year: z.number().int().min(2024),
});

export const CreateBillingLogSchema = BillingLogSchema.pick({
  alfaId: true,
  month: true,
  year: true,
  status: true,
  messageBody: true,
  amountCalculated: true,
});

export type GetBillingLogsInput = z.infer<typeof GetBillingLogsInputSchema>;
export type CreateBillingLogInput = z.infer<typeof CreateBillingLogSchema>;

// BILLING DASHBOARD SCHEMAS
export const GetDashboardDataInputSchema = z.object({
  alfaTempToken: z.string(),
  month: z.number().int().min(0).max(11),
  year: z.number().int(),
  forceRefresh: z.boolean().optional(),
});

export const SendBillingMessageInputSchema = z.object({
  alfaId: z.number().int(),
  name: z.string(),
  amountCalculated: z.number(),
  messageBody: z.string(),
  isSelfPaid: z.boolean(),
  studentTgChatId: z.string().nullable(),
  parentTgChatId: z.string().nullable(),
});

export const SendMassBillingInputSchema = z.object({
  month: z.number().int().min(0).max(11),
  year: z.number().int().min(2024),
  messages: z.array(SendBillingMessageInputSchema),
});

export type GetDashboardDataInput = z.infer<typeof GetDashboardDataInputSchema>;
export type SendBillingMessageInput = z.infer<
  typeof SendBillingMessageInputSchema
>;
export type SendMassBillingInput = z.infer<typeof SendMassBillingInputSchema>;

export type StudentForSend = SendBillingMessageInput & {
  isSent?: boolean;
  hasTg?: boolean;
};

