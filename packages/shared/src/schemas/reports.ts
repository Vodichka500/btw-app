import { z } from "zod";
import {
  ReportCriterionSchema,
  ReportSettingsSchema,
  ReportTemplateSchema,
  CriterionTypeSchema,
  StudentReport,
} from "@btw-app/db/zod";

export { CriterionTypeSchema, type StudentReport };
export type CriterionType = z.infer<typeof CriterionTypeSchema>;


export const ReminderTagSchema = z.enum([
  "{TEACHER_NAME}",
  "{CYCLE_NAME}",
  "{PERIOD_START}",
  "{PERIOD_END}",
  "{PENDING_COUNT}",
  "{TOTAL_COUNT}",
  "{DEADLINE}",
]);

// 2. Экспортируем тип для TypeScript
export type ReminderTag = z.infer<typeof ReminderTagSchema>;


export const UpdateReportSettingsSchema = ReportSettingsSchema.pick({
  deadlineDays: true,
  defaultReminderText: true
}).extend({
  deadlineDays: z.number().int(),
});


// --- TEMPLATE SCHEMAS ---
export const CriterionInputSchema = ReportCriterionSchema.pick({
  id: true,
  name: true,
  tag: true,
  type: true,
}).extend({
  id: z.number().int().optional(),
  type: CriterionTypeSchema,
});
export type CriterionInput = z.infer<typeof CriterionInputSchema>;

export const UpdateReportTemplateSchema = ReportTemplateSchema.pick({
  body: true,
})


export const SendReportInputSchema = z.object({
  reportId: z.number().int(),
  additionalText: z.string().nullable().optional(),
  generatedText: z.string(), // Финальный склеенный текст
});
export type SendReportInput = z.infer<typeof SendReportInputSchema>;

export const CancelReportInputSchema = z.object({
  reportId: z.number().int(),
  reason: z.string(),
});
export type CancelReportInput = z.infer<typeof CancelReportInputSchema>;

export const LessonTypeEnum = z.enum(["ALL", "INDIVIDUAL", "GROUP"]);
export type LessonType = z.infer<typeof LessonTypeEnum>;

export const GenerateCycleInputSchema = z.object({
  alfaTempToken: z.string(),
  periodStart: z.string(),
  periodEnd: z.string(),
  lessonType: LessonTypeEnum.default("ALL"),
  label: z.string().optional(),
});
export type GenerateCycleInput = z.infer<typeof GenerateCycleInputSchema>;

export const RefreshCycleInputSchema = z.object({
  cycleId: z.number().int(),
  alfaTempToken: z.string(),
  lessonType: z.enum(["ALL", "INDIVIDUAL", "GROUP"]).default("ALL"),
});


export const TemplateSnapshotSchema = ReportTemplateSchema.pick({
  id: true,
  body: true,
}).extend({
  criteria: z.array(ReportCriterionSchema),
});
export type TemplateSnapshot = z.infer<typeof TemplateSnapshotSchema>;