import { BillingLogSchema, BillingTemplateSchema } from "@btw-app/db/zod";
import { z } from "zod";
import { AlfaBillingItem, BillingSubject } from "./alfa";

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

export interface EnrichedBillingSubject extends BillingSubject {
  name: string;
}

export interface MergedBillingItem extends AlfaBillingItem {
  subjects: EnrichedBillingSubject[];
  studentTgChatId: string | null;
  parentTgChatId: string | null;
  isSelfPaid: boolean;
  isSent: boolean;
}

export interface UIBillingItem extends MergedBillingItem {
  generatedMessage: string;
}

export interface DashboardDataResponse {
  items: MergedBillingItem[];
  lastSync: Date | null;
  alfaFetchedAt: number;
}

export const SendBillingMessageInputSchema = CreateBillingLogSchema.pick({
  alfaId: true,
  messageBody: true,
  amountCalculated: true,
}).extend({
  name: z.string(),
  isSelfPaid: z.boolean(),
  studentTgChatId: z.string().nullable(),
  parentTgChatId: z.string().nullable(),
});

// 🔥 Заменили SendMassBillingInputSchema на SendSingleBillingInputSchema
export const SendSingleBillingInputSchema = z.object({
  month: z.number().int().min(0).max(11),
  year: z.number().int().min(2024),
  message: SendBillingMessageInputSchema, // Теперь это просто объект, а не массив
});

export type SendBillingMessageInput = z.infer<
  typeof SendBillingMessageInputSchema
>;
export type SendSingleBillingInput = z.infer<
  typeof SendSingleBillingInputSchema
>;




