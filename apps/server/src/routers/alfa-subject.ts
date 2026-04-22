import { router, managerProcedure } from "../trpc";
import { z } from "zod";
import { fetchAllAlfaPages } from "../lib/alfa-helpers";
import { alfaRouter } from "./alfa/alfa";
import { TRPCError } from "@trpc/server";

export const alfaSubjectRouter = router({
  synchronizeSubjects: managerProcedure.mutation(async ({ ctx }) => {
    try {
      const alfaCaller = alfaRouter.createCaller(ctx);


      // 1. Получаем токен для работы с Альфой
      const res = await alfaCaller.getTempToken();
      if (!res) {
        throw new Error("Brak tokenu AlfaCRM");
      }

      // 2. Скачиваем ВСЕ предметы из Альфы
      const alfaSubjects = await fetchAllAlfaPages<any>(
        res.token,
        "https://bridgetoworld.s20.online/v2api/1/subject/index", // Убедись что URL правильный
      );

      // Мапим то, что пришло из Альфы
      const incomingSubjects = alfaSubjects.map((s: any) => ({
        alfaId: Number(s.id),
        name: String(s.name),
      }));

      const alfaIds = incomingSubjects.map((s) => s.alfaId);

      // 3. Ищем, какие предметы у нас УЖЕ ЕСТЬ в базе
      const existingDbSubjects = await ctx.db.alfaSubject.findMany({
        where: { alfaId: { in: alfaIds } },
        select: { alfaId: true },
      });

      const existingSet = new Set(existingDbSubjects.map((s) => s.alfaId));

      // 4. Фильтруем только ТЕ, КОТОРЫХ НЕТ
      const missingSubjects = incomingSubjects.filter(
        (incoming) => !existingSet.has(incoming.alfaId),
      );

      // 5. Сохраняем новые в базу
      if (missingSubjects.length > 0) {
        await ctx.db.alfaSubject.createMany({
          data: missingSubjects,
        });
      }

      // 6. Обновляем время последней синхронизации
      await ctx.db.syncState.upsert({
        where: { type: "SUBJECTS" },
        update: { syncedAt: new Date() },
        create: { type: "SUBJECTS" },
      });

      return {
        added: missingSubjects.length,
      };
    } catch (error: any) {
      console.error("Błąd synchronizacji przedmiotów:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error.message || "Błąd pobierania danych z AlfaCRM",
      });
    }
  }),

  getSavedSubjects: managerProcedure.query(async ({ ctx }) => {
    const [items, syncRecord] = await Promise.all([
      ctx.db.alfaSubject.findMany({
        orderBy: { name: "asc" },
      }),
      ctx.db.syncState.findUnique({
        where: { type: "SUBJECTS" },
      }),
    ]);

    return {
      items,
      lastSync: syncRecord?.syncedAt || null,
    };
  }),

  updateName: managerProcedure
    .input(
      z.object({
        alfaId: z.number().int(),
        name: z.string().min(1, "Nazwa przedmiotu nie może być pusta"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.alfaSubject.update({
        where: { alfaId: input.alfaId },
        data: { name: input.name },
      });
    }),
});
