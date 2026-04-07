import { router, adminProcedure } from "../trpc";
import { z } from "zod";

export const alfaSubjectRouter = router({
  synchronizeSubjects: adminProcedure
    .input(
      z.object({
        subjects: z.array(
          z.object({
            alfaId: z.number().int(),
            name: z.string(),
          }),
        ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const incomingSubjects = input.subjects;
      const alfaIds = incomingSubjects.map((s) => s.alfaId);

      const existingDbSubjects = await ctx.db.alfaSubject.findMany({
        where: { alfaId: { in: alfaIds } },
        select: { alfaId: true },
      });

      const existingSet = new Set(existingDbSubjects.map((s) => s.alfaId));

      const missingSubjects = incomingSubjects
        .filter((incoming) => !existingSet.has(incoming.alfaId))
        .map((incoming) => ({
          alfaId: incoming.alfaId,
          name: incoming.name,
        }));

      if (missingSubjects.length > 0) {
        await ctx.db.alfaSubject.createMany({
          data: missingSubjects,
        });
      }

      await ctx.db.syncState.upsert({
        where: { type: "SUBJECTS" },
        update: { syncedAt: new Date() },
        create: { type: "SUBJECTS" },
      });

      return {
        added: missingSubjects.length,
      };
    }),

  getSavedSubjects: adminProcedure.query(async ({ ctx }) => {
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

  updateName: adminProcedure
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
