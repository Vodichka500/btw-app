import { router, publicProcedure } from "../trpc";
import { z } from "zod";
import {
  UpdateTeacherSchema,
  UpdateTeacherSubjectsSchema,
  CreateWorkingHourSchema,
  UpdateWorkingHourSchema,
} from "@btw-app/shared";

export const teacherRouter = router({
  // Сами преподаватели
  getAll: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.teacher.findMany();
  }),

  update: publicProcedure
    .input(UpdateTeacherSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.db.teacher.update({ where: { id }, data });
    }),

  // Связи с предметами
  getSubjects: publicProcedure
    .input(z.object({ teacherId: z.number().int() }))
    .query(async ({ ctx, input }) => {
      const links = await ctx.db.teacherSubject.findMany({
        where: { teacherId: input.teacherId },
        select: { subjectId: true },
      });
      return links.map((l) => l.subjectId);
    }),

  updateSubjects: publicProcedure
    .input(UpdateTeacherSubjectsSchema)
    .mutation(async ({ ctx, input }) => {
      const { teacherId, subjectIds } = input;
      await ctx.db.$transaction([
        ctx.db.teacherSubject.deleteMany({ where: { teacherId } }),
        ctx.db.teacherSubject.createMany({
          data: subjectIds.map((subjectId) => ({ teacherId, subjectId })),
        }),
      ]);
      return true;
    }),

  // Рабочие часы
  getWorkingHours: publicProcedure
    .input(z.object({ teacherId: z.number().int() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.teacherWorkingHour.findMany({
        where: { teacherId: input.teacherId },
      });
    }),

  createWorkingHour: publicProcedure
    .input(CreateWorkingHourSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.db.teacherWorkingHour.create({ data: input });
    }),

  updateWorkingHour: publicProcedure
    .input(UpdateWorkingHourSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.db.teacherWorkingHour.update({ where: { id }, data });
    }),

  deleteWorkingHour: publicProcedure
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.teacherWorkingHour.delete({ where: { id: input.id } });
    }),
});
