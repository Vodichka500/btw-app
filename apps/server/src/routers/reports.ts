import { router, managerProcedure, protectedProcedure } from "../trpc";
import { z } from "zod";
import {
  UpdateReportSettingsSchema,
  UpdateReportTemplateSchema,
  CriterionInputSchema,
  SendReportInputSchema,
  CancelReportInputSchema,
  GenerateCycleInputSchema,
  RefreshCycleInputSchema,
} from "@btw-app/shared";
import { TRPCError } from "@trpc/server";
import { telegramRouter } from "./telegram";
import {
  fetchAndPrepareReportsData,
} from "../lib/report-helpers";

export const reportRouter = router({
  // ==========================================
  //  SETTINGS
  // ==========================================
  getSettings: managerProcedure.query(async ({ ctx }) => {
    const settings = await ctx.db.reportSettings.findUnique({
      where: { id: 1 },
    });

    if (!settings) {
      return {
        deadlineDays: 7,
        defaultReminderText: "",
      };
    }
    return settings;
  }),

  updateGeneralSettings: managerProcedure
    .input(UpdateReportSettingsSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.db.reportSettings.upsert({
        where: { id: 1 },
        update: input,
        create: { id: 1, ...input },
      });
    }),

  // ==========================================
  //  REPORT TEMPLATE
  // ==========================================

  getTemplate: managerProcedure.query(async ({ ctx }) => {
    const template = await ctx.db.reportTemplate.findUnique({
      where: { id: 1 },
      include: { criteria: true },
    });

    return template || { body: "", criteria: [] };
  }),

  updateTemplateBody: managerProcedure
    .input(UpdateReportTemplateSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.db.reportTemplate.upsert({
        where: { id: 1 },
        update: { body: input.body },
        create: { id: 1, body: input.body },
      });
    }),

  // ==========================================
  //  REPORT TEMPLATE CRITERIA
  // ==========================================
  upsertCriterion: managerProcedure
    .input(CriterionInputSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      await ctx.db.reportTemplate.upsert({
        where: { id: 1 },
        update: {},
        create: { id: 1, body: "" },
      });

      if (id && id > 0) {
        return ctx.db.reportCriterion.update({
          where: { id },
          data,
        });
      } else {
        return ctx.db.reportCriterion.create({
          data: { ...data, templateId: 1 },
        });
      }
    }),

  deleteCriterion: managerProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.reportCriterion.delete({
        where: { id: input.id },
      });
    }),

  // ==========================================
  // UI DATA (DASHBOARD)
  // ==========================================

  getReportCycles: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.reportCycle.findMany({
      where: { isArchived: false },
      orderBy: { periodStart: "desc" },
    });
  }),

  /**
   * Получаем репорты для конкретного цикла. Если targetTeacherId передан - фильтруем по нему, иначе возвращаем для текущего препода.
   */
  getWorkspaceReports: protectedProcedure
    .input(
      z.object({
        cycleId: z.number().int(),
        targetTeacherId: z.number().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      let targetInternalTeacherId = ctx.user.teacherId;

      if (input.targetTeacherId) {
        if (ctx.user.role !== "ADMIN" && ctx.user.role !== "MANAGER")
          throw new TRPCError({ code: "FORBIDDEN", message: "Brak uprawnień" });
        targetInternalTeacherId = input.targetTeacherId;
      }

      if (!targetInternalTeacherId) return [];

      const teacher = await ctx.db.teacher.findUnique({
        where: { id: targetInternalTeacherId },
      });
      if (!teacher) return [];

      const reports = await ctx.db.studentReport.findMany({
        where: { teacherId: teacher.alfacrmId, cycleId: input.cycleId },
        include: { student: true, cycle: true },
        orderBy: { student: { name: "asc" } },
      });
      return reports;
    }),

  // ==========================================
  // REPORTS ACTONS
  // ==========================================
  sendReport: protectedProcedure
    .input(SendReportInputSchema)
    .mutation(async ({ ctx, input }) => {
      const report = await ctx.db.studentReport.findUnique({
        where: { id: input.reportId },
        include: { student: true },
      });

      if (!report)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Raport nie znaleziony",
        });

      const parentChatId = report.student.parentTgChatId;

      if (!parentChatId) {
        return ctx.db.studentReport.update({
          where: { id: input.reportId },
          data: {
            status: "FAILED",
            additionalText: input.additionalText,
            generatedText: input.generatedText,
            sendError:
              "Brak przypisanego konta rodzica w Telegramie. Sprawdź profil klienta.",
          },
        });
      }

      try {
        const telegramCaller = telegramRouter.createCaller(ctx);

        await telegramCaller.sendMessage({
          chatId: parentChatId,
          text: input.generatedText,
        });

        return await ctx.db.studentReport.update({
          where: { id: input.reportId },
          data: {
            status: "SENT",
            sentAt: new Date(),
            additionalText: input.additionalText,
            generatedText: input.generatedText,
            sendError: null,
          },
        });
      } catch (error: any) {
        console.error("Błąd wysyłania TG:", error);
        return ctx.db.studentReport.update({
          where: { id: input.reportId },
          data: {
            status: "FAILED",
            additionalText: input.additionalText,
            generatedText: input.generatedText,
            sendError: `Błąd Telegram: ${error.message || "Nieznany błąd"}`,
          },
        });
      }
    }),

  cancelReport: protectedProcedure
    .input(CancelReportInputSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.db.studentReport.update({
        where: { id: input.reportId },
        data: {
          status: "CANCELED",
          canceledAt: new Date(),
          cancelReason: input.reason,
          sendError: null,
        },
      });
    }),

  restoreReport: protectedProcedure
    .input(z.object({ reportId: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.studentReport.update({
        where: { id: input.reportId },
        data: {
          status: "PENDING",
          canceledAt: null,
          cancelReason: null,
          sendError: null,
        },
      });
    }),

  // ==========================================
  // REPORT CYCLE ACTIONS (ГЕНЕРАЦИЯ И ОБНОВЛЕНИЕ)
  // ==========================================

  generateCycle: managerProcedure
    .input(GenerateCycleInputSchema)
    .mutation(async ({ ctx, input }) => {
      // Получаем сырые данные для отчетов
      const { reportsBase, missingTeachers, missingCustomers } =
        await fetchAndPrepareReportsData({
          ctx,
          alfaTempToken: input.alfaTempToken,
          periodStart: input.periodStart,
          periodEnd: input.periodEnd,
          lessonType: input.lessonType,
        });

      // Создаем сам цикл
      const cycle = await ctx.db.reportCycle.create({
        data: {
          periodStart: new Date(input.periodStart),
          periodEnd: new Date(input.periodEnd),
          label: input.label || null,
          missingTeachers,
          missingCustomers,
        },
      });

      // Добавляем ID цикла к отчетам и сохраняем
      const finalReports = reportsBase.map((r) => ({
        ...r,
        cycleId: cycle.id,
      }));

      if (finalReports.length > 0) {
        await ctx.db.studentReport.createMany({ data: finalReports });
      }

      return {
        cycleId: cycle.id,
        reportsGenerated: finalReports.length,
        warnings: {
          missingTeacherAlfaIds: missingTeachers,
          missingCustomerAlfaIds: missingCustomers,
        },
      };
    }),

  refreshCycle: managerProcedure
    .input(RefreshCycleInputSchema)
    .mutation(async ({ ctx, input }) => {
      // 1. Ищем цикл
      const cycle = await ctx.db.reportCycle.findUnique({
        where: { id: input.cycleId },
      });
      if (!cycle)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Cykl nie istnieje",
        });

      // 2. Собираем уже существующие пары учитель-ученик, чтобы не создавать дубли
      const existingReports = await ctx.db.studentReport.findMany({
        where: { cycleId: cycle.id },
        select: { teacherId: true, studentId: true },
      });
      const existingPairs = new Set(
        existingReports.map((r) => `${r.teacherId}_${r.studentId}`),
      );

      // 3. Получаем новые данные для отчетов
      const pStart = cycle.periodStart.toISOString().split("T")[0];
      const pEnd = cycle.periodEnd.toISOString().split("T")[0];

      const { reportsBase, missingTeachers, missingCustomers } =
        await fetchAndPrepareReportsData({
          ctx,
          alfaTempToken: input.alfaTempToken,
          periodStart: pStart,
          periodEnd: pEnd,
          lessonType: input.lessonType,
          existingPairs, // Передаем существующие пары для фильтрации!
        });

      // 4. Обновляем массивы "потеряшек" в цикле
      await ctx.db.reportCycle.update({
        where: { id: cycle.id },
        data: {
          missingTeachers,
          missingCustomers,
        },
      });

      // 5. Сохраняем новые отчеты, привязав к циклу
      const finalReports = reportsBase.map((r) => ({
        ...r,
        cycleId: cycle.id,
      }));

      if (finalReports.length > 0) {
        await ctx.db.studentReport.createMany({ data: finalReports });
      }

      return {
        message: "Cykl zaktualizowany",
        newReportsAdded: finalReports.length,
      };
    }),

  // ==========================================
  // REPORTS CYCLE MANAGEMENT (СПИСОК, СТАТИСТИКА, УДАЛЕНИЕ)
  // ==========================================

  /**
   * Возврвщает список всех циклов со статистикой
   */
  getAdminCycles: managerProcedure.query(async ({ ctx }) => {
    const cycles = await ctx.db.reportCycle.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        reports: { select: { status: true } },
      },
    });

    return cycles.map((cycle) => {
      const total = cycle.reports.length;
      const sent = cycle.reports.filter((r) => r.status === "SENT").length;
      const canceled = cycle.reports.filter(
        (r) => r.status === "CANCELED",
      ).length;
      const failed = cycle.reports.filter((r) => r.status === "FAILED").length;
      const pending = cycle.reports.filter(
        (r) => r.status === "PENDING",
      ).length;

      return {
        id: cycle.id,
        label: cycle.label,
        periodStart: cycle.periodStart,
        periodEnd: cycle.periodEnd,
        createdAt: cycle.createdAt,
        isArchived: cycle.isArchived,
        missingTeachers: cycle.missingTeachers,
        missingCustomers: cycle.missingCustomers,
        stats: { total, sent, canceled, failed, pending },
      };
    });
  }),

  /**
   * Возвращает статистику по учителям для конкретного цикла.
   */
  getCycleTeacherStats: managerProcedure
    .input(z.object({ cycleId: z.number().int() }))
    .query(async ({ ctx, input }) => {
      const reports = await ctx.db.studentReport.findMany({
        where: { cycleId: input.cycleId },
        include: {
          teacher: {
            include: { users: true },
          },
        },
      });

      // Группируем руками для простоты и гибкости
      const teacherMap = new Map<number, any>();

      for (const r of reports) {
        if (!teacherMap.has(r.teacherId)) {
          teacherMap.set(r.teacherId, {
            teacherId: r.teacherId, // AlfaID
            teacherInternalId: r.teacher.id, // Для перехода в профиль
            teacherName: r.teacher.name,
            tgChatId: r.teacher.users?.[0]?.tgChatId || null,
            total: 0,
            sent: 0,
            pending: 0,
            canceled: 0,
            failed: 0,
          });
        }

        const stat = teacherMap.get(r.teacherId);
        stat.total += 1;
        if (r.status === "SENT") stat.sent += 1;
        if (r.status === "PENDING") stat.pending += 1;
        if (r.status === "CANCELED") stat.canceled += 1;
        if (r.status === "FAILED") stat.failed += 1;
      }

      return Array.from(teacherMap.values()).sort((a, b) =>
        a.teacherName.localeCompare(b.teacherName),
      );
    }),

  deleteCycle: managerProcedure
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.reportCycle.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),
});
