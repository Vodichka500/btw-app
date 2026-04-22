import { router, managerProcedure } from "../trpc";
import { z } from "zod";
import {
  UpdateTeacherSchema,
  UpdateTeacherSubjectsSchema,
  CreateWorkingHourSchema,
  UpdateWorkingHourSchema,
} from "@btw-app/shared";

export const teacherRouter = router({
  // Сами преподаватели
  getAll: managerProcedure.query(async ({ ctx }) => {
    return ctx.db.teacher.findMany();
  }),

  update: managerProcedure
    .input(UpdateTeacherSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.db.teacher.update({ where: { id }, data });
    }),

  // Связи с предметами
  getSubjects: managerProcedure
    .input(z.object({ teacherId: z.number().int() }))
    .query(async ({ ctx, input }) => {
      const links = await ctx.db.teacherSubject.findMany({
        where: { teacherId: input.teacherId },
        select: { subjectId: true },
      });
      return links.map((l) => l.subjectId);
    }),

  updateSubjects: managerProcedure
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
  getWorkingHours: managerProcedure
    .input(z.object({ teacherId: z.number().int() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.teacherWorkingHour.findMany({
        where: { teacherId: input.teacherId },
      });
    }),

  createWorkingHour: managerProcedure
    .input(CreateWorkingHourSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.db.teacherWorkingHour.create({ data: input });
    }),

  updateWorkingHour: managerProcedure
    .input(UpdateWorkingHourSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.db.teacherWorkingHour.update({ where: { id }, data });
    }),

  deleteWorkingHour: managerProcedure
    .input(z.number().int())
    .mutation(async ({ ctx, input }) => {
      return ctx.db.teacherWorkingHour.delete({ where: { id: input } });
    }),
});
