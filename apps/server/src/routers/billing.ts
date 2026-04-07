import { router, adminProcedure } from "../trpc";
import { alfaBilling } from "./alfa/alfa-billing";
import { telegramRouter } from "./telegram";
import {
  GetDashboardDataInputSchema,
  SendMassBillingInputSchema,
} from "@btw-app/shared";

export const billingRouter = router({
  getDashboardData: adminProcedure
    .input(GetDashboardDataInputSchema)
    .query(async ({ ctx, input }) => {
      const { month, year, alfaTempToken, forceRefresh } = input;

      const alfaCaller = alfaBilling.createCaller(ctx);
      const alfaData = await alfaCaller.getBillingReport({
        alfaTempToken,
        month,
        year,
        forceRefresh,
      });

      const alfaIds = alfaData.items.map((i: any) => i.alfaId);

      // 🔥 Собираем все уникальные ID предметов из полученных данных
      const subjectIds = new Set<number>();
      alfaData.items.forEach((item: any) => {
        if (Array.isArray(item.subjects)) {
          item.subjects.forEach((s: any) => subjectIds.add(s.id));
        }
      });

      // Добавили запрос локальных предметов в общий Promise.all
      const [localCustomers, sentLogs, syncRecord, localSubjects] =
        await Promise.all([
          ctx.db.customer.findMany({
            where: { alfaId: { in: alfaIds } },
            select: {
              alfaId: true,
              studentTgChatId: true,
              parentTgChatId: true,
              isSelfPaid: true,
            },
          }),
          ctx.db.billingLog.findMany({
            where: {
              alfaId: { in: alfaIds },
              month: month,
              year: year,
              status: "SUCCESS",
            },
            select: { alfaId: true },
          }),
          ctx.db.syncState.findUnique({
            where: { type: "CUSTOMERS" },
          }),
          ctx.db.alfaSubject.findMany({
            where: { alfaId: { in: Array.from(subjectIds) } },
            select: { alfaId: true, name: true },
          }),
        ]);

      const customerMap = new Map(localCustomers.map((c) => [c.alfaId, c]));
      const sentSet = new Set(sentLogs.map((l) => l.alfaId));
      const subjectMap = new Map(localSubjects.map((s) => [s.alfaId, s.name]));

      const mergedItems = alfaData.items.map((alfaItem: any) => {
        const local = customerMap.get(alfaItem.alfaId);

        // 🔥 Обогащаем предметы красивыми локальными названиями прямо на бэкенде
        const enrichedSubjects =
          alfaItem.subjects?.map((subj: any) => ({
            id: subj.id,
            quantity: subj.quantity,
            name: subjectMap.get(subj.id) || `ID: ${subj.id}`,
          })) || [];

        return {
          ...alfaItem,
          subjects: enrichedSubjects, // Заменяем оригинальные предметы обогащенными
          studentTgChatId: local?.studentTgChatId || null,
          parentTgChatId: local?.parentTgChatId || null,
          isSelfPaid: local?.isSelfPaid ?? true,
          isSent: sentSet.has(alfaItem.alfaId),
        };
      });

      return {
        items: mergedItems,
        lastSync: syncRecord?.syncedAt || null,
        alfaFetchedAt: alfaData.fetchedAt,
      };
    }),

  sendMassBilling: adminProcedure
    .input(SendMassBillingInputSchema)
    .mutation(async ({ ctx, input }) => {
      const tgCaller = telegramRouter.createCaller(ctx);

      let sentCount = 0;
      let failedCount = 0;
      const errStatuses: { alfaId: number; name: string; reason: string }[] =
        [];
      const logsToInsert: any[] = [];

      for (const msg of input.messages) {
        try {
          if (!msg.tgChatId) throw new Error("Brak Telegram ID");
          if (!msg.messageBody || msg.messageBody.trim() === "")
            throw new Error("Pusta wiadomość");

          await tgCaller.sendMessage({
            chatId: msg.tgChatId,
            text: msg.messageBody,
          });

          sentCount++;
          logsToInsert.push({
            alfaId: msg.alfaId,
            month: input.month,
            year: input.year,
            amountCalculated: msg.amountCalculated,
            messageBody: msg.messageBody,
            status: "SUCCESS",
          });
        } catch (error: any) {
          failedCount++;
          errStatuses.push({
            alfaId: msg.alfaId,
            name: msg.name,
            reason: error.message || "Nieznany błąd",
          });

          logsToInsert.push({
            alfaId: msg.alfaId,
            month: input.month,
            year: input.year,
            amountCalculated: msg.amountCalculated,
            messageBody: msg.messageBody,
            status: "FAILED",
          });
        }
      }

      if (logsToInsert.length > 0) {
        await ctx.db.billingLog.createMany({
          data: logsToInsert,
        });
      }

      let finalStatus: "SUCCESS" | "PARTIAL" | "FAILED" = "SUCCESS";
      if (failedCount > 0 && sentCount > 0) finalStatus = "PARTIAL";
      if (sentCount === 0 && failedCount > 0) finalStatus = "FAILED";
      if (input.messages.length === 0) finalStatus = "SUCCESS";

      return {
        status: finalStatus,
        sent: sentCount,
        failed: failedCount,
        errStatuses,
      };
    }),
});
