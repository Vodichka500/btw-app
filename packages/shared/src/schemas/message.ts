import { MessageLogSchema } from "@btw-app/db/zod"; // Убедись, что импорт совпадает с твоим сетапом
import { z } from "zod";

export const GetMessageLogsInputSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(50),
  search: z.string().optional(),
  status: z.enum(["SUCCESS", "FAILED"]).optional(),
});

export const CreateMessageLogSchema = MessageLogSchema.pick({
  alfaId: true,
  status: true,
  messageBody: true,
  errorReason: true, // Опциональное поле для FAILED
});

export type GetMessageLogsInput = z.infer<typeof GetMessageLogsInputSchema>;
export type CreateMessageLogInput = z.infer<typeof CreateMessageLogSchema>;

export const SendSingleMessageInputSchema = z.object({
  alfaId: z.number().int(),
  messageBody: z.string().min(1, "Pusta wiadomość"),
  targetAudience: z.enum(["STUDENT", "PARENT"]),
  studentTgChatId: z.string().nullable(),
  parentTgChatId: z.string().nullable(),
});