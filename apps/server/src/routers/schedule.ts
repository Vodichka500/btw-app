import { router, publicProcedure } from "../trpc";

export const scheduleRouter = router({
  getDashboardData: publicProcedure.query(async ({ ctx }) => {
    const subjects = await ctx.db.subject.findMany({
      include: {
        teachers: {
          include: { teacher: true },
        },
      },
    });

    const formattedSubjects = subjects.map((sub) => ({
      ...sub,
      teachers: sub.teachers.map((link) => link.teacher),
    }));

    const unassignedTeachers = await ctx.db.teacher.findMany({
      where: { subjects: { none: {} } },
    });

    return {
      subjects: formattedSubjects,
      unassignedTeachers,
    };
  }),
});
