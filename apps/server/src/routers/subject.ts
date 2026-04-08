import { router, managerProcedure } from "../trpc";
import { z } from "zod";
import { CreateSubjectSchema, UpdateSubjectSchema } from "@btw-app/shared";

export const subjectRouter = router({
  getAll: managerProcedure.query(async ({ ctx }) => {
    return ctx.db.subject.findMany({ orderBy: { order: "asc" } });
  }),

  create: managerProcedure
    .input(CreateSubjectSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.db.subject.create({ data: { name: input.name } });
    }),

  update: managerProcedure
    .input(UpdateSubjectSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.db.subject.update({
        where: { id: input.id },
        data: { name: input.name },
      });
    }),

  delete: managerProcedure
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.subject.delete({ where: { id: input.id } });
    }),
});
