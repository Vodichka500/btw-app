import { z } from "zod";
import {
  ReportCriterionSchema,
  ReportSettingsSchema,
  ReportTemplateSchema,
} from "@btw-app/db/zod";

export const ReminderTagSchema = z.enum([
  "{TEACHER_NAME}",
  "{CYCLE_NAME}",
  "{PERIOD_START}",
  "{PERIOD_END}",
  "{PENDING_COUNT}",
  "{TOTAL_COUNT}",
  "{DEADLINE}",
]);

export type ReminderTag = z.infer<typeof ReminderTagSchema>;

export const ReportCriterionTypeSchema = z.enum(["SELECT", "TEXT"]);
export type ReportCriterionType = z.infer<typeof ReportCriterionTypeSchema>;

export const UpdateReportSettingsSchema = ReportSettingsSchema.pick({
  deadlineDays: true,
  defaultReminderText: true,
}).extend({
  deadlineDays: z.number().int(),
});

export const CriterionInputSchema = ReportCriterionSchema.pick({
  id: true,
  name: true,
  tag: true,
  options: true,
  type: true,
  required: true,
})
  .extend({
    id: z.number().int().optional(),
    type: ReportCriterionTypeSchema.default("SELECT"),
    required: z.boolean().default(true),
    options: z.array(z.string()),
  })
  .superRefine((value, ctx) => {
    if (value.type === "SELECT" && value.options.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["options"],
        message: "Добавь хотя бы один вариант",
      });
    }
  });
export type CriterionInput = z.infer<typeof CriterionInputSchema>;

export const UpdateReportTemplateSchema = ReportTemplateSchema.pick({
  body: true,
});

export const SendReportInputSchema = z.object({
  reportId: z.number().int(),
  generatedText: z.string(),
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
  lessonType: LessonTypeEnum.default("ALL"),
});

const SnapshotCriterionSchema = ReportCriterionSchema.extend({
  type: ReportCriterionTypeSchema.default("SELECT"),
  required: z.boolean().default(true),
});

export const TemplateSnapshotSchema = ReportTemplateSchema.pick({
  id: true,
  body: true,
}).extend({
  criteria: z.array(SnapshotCriterionSchema),
});
export type TemplateSnapshot = z.infer<typeof TemplateSnapshotSchema>;
