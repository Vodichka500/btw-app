import { router, adminProcedure } from "../trpc";
import { z } from "zod";
import { CreateSubjectSchema, UpdateSubjectSchema } from "@btw-app/shared";

export const subjectRouter = router({
  getAll: adminProcedure.query(async ({ ctx }) => {
    return ctx.db.subject.findMany({ orderBy: { order: "asc" } });
  }),

  create: adminProcedure
    .input(CreateSubjectSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.db.subject.create({ data: { name: input.name } });
    }),

  update: adminProcedure
    .input(UpdateSubjectSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.db.subject.update({
        where: { id: input.id },
        data: { name: input.name },
      });
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.subject.delete({ where: { id: input.id } });
    }),
});
