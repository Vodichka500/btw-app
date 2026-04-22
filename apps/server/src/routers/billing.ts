import { router, managerProcedure } from "../trpc";
import { alfaBilling } from "./alfa/alfa-billing";
import { telegramRouter } from "./telegram";
import {
  AlfaBillingItem,
  BillingReportResponse,
  DashboardDataResponse,
  EnrichedBillingSubject,
  GetDashboardDataInputSchema,
  MergedBillingItem,
  SendSingleBillingInputSchema,
} from "@btw-app/shared";

export const billingRouter = router({
  getDashboardData: managerProcedure
    .input(GetDashboardDataInputSchema)
    .query(async ({ ctx, input }): Promise<DashboardDataResponse> => {
      const { month, year, alfaTempToken, forceRefresh } = input;

      const alfaCaller = alfaBilling.createCaller(ctx);
      const alfaData: BillingReportResponse = await alfaCaller.getBillingReport(
        {
          alfaTempToken,
          month,
          year,
          forceRefresh,
        },
      );

      const alfaIds = alfaData.items.map((i: any) => i.alfaId);

      const subjectIds = new Set<number>();
      alfaData.items.forEach((item: any) => {
        if (Array.isArray(item.subjects)) {
          item.subjects.forEach((s: any) => subjectIds.add(s.id));
        }
      });

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

      const mergedItems: MergedBillingItem[] = alfaData.items.map(
        (alfaItem: AlfaBillingItem) => {
          const local = customerMap.get(alfaItem.alfaId);

          const enrichedSubjects: EnrichedBillingSubject[] =
            alfaItem.subjects?.map((subj) => ({
              id: subj.id,
              quantity: subj.quantity,
              name: subjectMap.get(subj.id) || `ID: ${subj.id}`,
            })) || [];

          return {
            ...alfaItem,
            subjects: enrichedSubjects,
            studentTgChatId: local?.studentTgChatId || null,
            parentTgChatId: local?.parentTgChatId || null,
            isSelfPaid: local?.isSelfPaid ?? true,
            isSent: sentSet.has(alfaItem.alfaId),
          };
        },
      );

      return {
        items: mergedItems,
        lastSync: syncRecord?.syncedAt || null,
        alfaFetchedAt: alfaData.fetchedAt,
      };
    }),

  sendSingleBilling: managerProcedure
    .input(SendSingleBillingInputSchema)
    .mutation(async ({ ctx, input }) => {
      const tgCaller = telegramRouter.createCaller(ctx);
      const { month, year, message: msg } = input;

      const targetChatId = msg.isSelfPaid
        ? msg.studentTgChatId
        : msg.parentTgChatId;

      if (!targetChatId) {
        const payer = msg.isSelfPaid
          ? "ucznia (płaci sam)"
          : "rodzica/opiekuna";
        throw new Error(`Brak Telegram ID dla ${payer}`);
      }

      if (!msg.messageBody || msg.messageBody.trim() === "") {
        throw new Error("Pusta wiadomość");
      }

      try {
        // Пробуем отправить сообщение
        await tgCaller.sendMessage({
          chatId: targetChatId,
          text: msg.messageBody,
        });

        // Если успешно — пишем в логи
        await ctx.db.billingLog.create({
          data: {
            alfaId: msg.alfaId,
            month: month,
            year: year,
            amountCalculated: msg.amountCalculated,
            messageBody: msg.messageBody,
            status: "SUCCESS",
          },
        });

        return { success: true };
      } catch (error: any) {
        // Если ошибка — тоже пишем в логи, но со статусом FAILED
        await ctx.db.billingLog.create({
          data: {
            alfaId: msg.alfaId,
            month: month,
            year: year,
            amountCalculated: msg.amountCalculated,
            messageBody: msg.messageBody,
            status: "FAILED",
          },
        });

        // Прокидываем ошибку дальше, чтобы фронтенд-цикл её перехватил и вывел юзеру
        throw new Error(error.message || "Nieznany błąd Telegram");
      }
    }),
});
