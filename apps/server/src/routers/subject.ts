import { router, publicProcedure } from "../trpc";
import { z } from "zod";
import { CreateSubjectSchema, UpdateSubjectSchema } from "@btw-app/shared";

export const subjectRouter = router({
  getAll: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.subject.findMany({ orderBy: { order: "asc" } });
  }),

  create: publicProcedure
    .input(CreateSubjectSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.db.subject.create({ data: { name: input.name } });
    }),

  update: publicProcedure
    .input(UpdateSubjectSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.db.subject.update({
        where: { id: input.id },
        data: { name: input.name },
      });
    }),

  delete: publicProcedure
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.subject.delete({ where: { id: input.id } });
    }),
});
