import { router, managerProcedure } from "../../trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { Prisma } from "@btw-app/db";
import {
  type AlfaTeacher,
  type ScheduleLesson,
  type AlfaCrmSubject,
} from "@btw-app/shared";
import {
  getAlfaCrmToken,
  fetchAllAlfaPages,
  parseAlfaTime,
} from "../../lib/alfa-helpers";


export const alfaRouter = router({
  getTempToken: managerProcedure.query(async ({ ctx }) => {
    const user = ctx.user;

    if (!user || !user.alfaEmail || !user.alfaToken) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Brak poświadczeń AlfaCRM. Skonfiguruj profil.",
      });
    }

    const token = await getAlfaCrmToken(user.alfaEmail, user.alfaToken);

    return {
      token,
      expiresIn: 3600, // В секундах
    };
  }),

  updateTeachers: managerProcedure
    .input(z.object({ alfaTempToken: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const alfaTeachers = await fetchAllAlfaPages<AlfaTeacher>(
        input.alfaTempToken,
        "https://bridgetoworld.s20.online/v2api/1/teacher/index",
        { removed: 0 },
      );

      const dbTeachers = await ctx.db.teacher.findMany();
      const dbTeachersMap = new Map(dbTeachers.map((t) => [t.alfacrmId, t]));

      const newTeachers: Prisma.TeacherCreateManyInput[] = [];
      const teachersToUpdate: {
        id: number;
        data: Prisma.TeacherUpdateInput;
      }[] = [];

      for (const alfa of alfaTeachers) {
        const formattedName = alfa.name;
        const formattedEmail =
          alfa.email && alfa.email.length > 0 ? alfa.email.join(", ") : null;
        const formattedPhone = alfa.phone ? String(alfa.phone) : null;
        const formattedAvatar = alfa.avatarUrl || null;

        const existingTeacher = dbTeachersMap.get(alfa.id);

        if (!existingTeacher) {
          newTeachers.push({
            alfacrmId: alfa.id,
            name: formattedName,
            email: formattedEmail,
            phone: formattedPhone,
            avatarUrl: formattedAvatar,
            note: "Notatka",
          });
        } else {
          const hasChanges =
            existingTeacher.name !== formattedName ||
            existingTeacher.email !== formattedEmail ||
            existingTeacher.phone !== formattedPhone ||
            existingTeacher.avatarUrl !== formattedAvatar;

          if (hasChanges) {
            teachersToUpdate.push({
              id: existingTeacher.id,
              data: {
                name: formattedName,
                email: formattedEmail,
                phone: formattedPhone,
                avatarUrl: formattedAvatar,
              },
            });
          }
        }
      }

      if (newTeachers.length > 0) {
        await ctx.db.teacher.createMany({ data: newTeachers });
      }

      if (teachersToUpdate.length > 0) {
        await ctx.db.$transaction(
          teachersToUpdate.map((update) =>
            ctx.db.teacher.update({
              where: { id: update.id },
              data: update.data,
            }),
          ),
        );
      }

      return {
        status: "success",
        added: newTeachers.length,
        updated: teachersToUpdate.length,
        total: alfaTeachers.length,
      };
    }),

  // 3. Получить расписание (Клиент передает временный токен)
  getTeacherLessons: managerProcedure
    .input(
      z.object({
        teacherAlfacrmId: z.number().int(),
        alfaTempToken: z.string(),
      }),
    )
    .query(async ({ input }) => {
      const { alfaTempToken, teacherAlfacrmId } = input;

      const [regularLessons, alfaSubjects] = await Promise.all([
        fetchAllAlfaPages<ScheduleLesson>(
          alfaTempToken,
          "https://bridgetoworld.s20.online/v2api/1/regular-lesson/index",
          { teacher_id: teacherAlfacrmId },
        ),
        fetchAllAlfaPages<AlfaCrmSubject>(
          alfaTempToken,
          "https://bridgetoworld.s20.online/v2api/1/subject/index",
          { active: true },
        ),
      ]);

      const subjectMap = new Map(alfaSubjects.map((s) => [s.id, s.name]));
      const customerIds = new Set<number>();
      const groupIds = new Set<number>();

      regularLessons.forEach((lesson) => {
        if (lesson.related_class === "Customer")
          customerIds.add(lesson.related_id);
        if (lesson.related_class === "Group") groupIds.add(lesson.related_id);
      });

      let customers: any[] = [];
      let groups: any[] = [];

      if (customerIds.size > 0) {
        customers = await fetchAllAlfaPages<any>(
          alfaTempToken,
          "https://bridgetoworld.s20.online/v2api/1/customer/index",
          { id: Array.from(customerIds) },
        );
      }
      if (groupIds.size > 0) {
        groups = await fetchAllAlfaPages<any>(
          alfaTempToken,
          "https://bridgetoworld.s20.online/v2api/1/group/index",
          { id: Array.from(groupIds) },
        );
      }

      const customerMap = new Map(customers.map((c) => [c.id, c.name]));
      const groupMap = new Map(groups.map((g) => [g.id, g.name]));

      const lessonsMap: Record<string, any[]> = {};
      const getCell = (d: number, h: number) => {
        const key = `${d}-${h}`;
        if (!lessonsMap[key]) lessonsMap[key] = [];
        return lessonsMap[key];
      };

      regularLessons.forEach((lesson) => {
        const dayIndex = lesson.day - 1;
        const { startHour, startMin, endHour, endMin, maxH } = parseAlfaTime(
          lesson.time_from_v,
          lesson.time_to_v,
        );

        const subjectName =
          subjectMap.get(lesson.subject_id) ||
          `Przedmiot ID:${lesson.subject_id}`;
        let studentStr = "";

        if (lesson.related_class === "Group") {
          studentStr =
            groupMap.get(lesson.related_id) || `Grupa #${lesson.related_id}`;
        }
        if (lesson.related_class === "Customer") {
          studentStr =
            customerMap.get(lesson.related_id) ||
            `Klient #${lesson.related_id}`;
        }

        for (let h = startHour; h <= maxH; h++) {
          const cell = getCell(dayIndex, h);
          const sMin = h === startHour ? startMin : 0;
          const eMin = h === endHour ? endMin : 60;

          cell.push({
            subject: subjectName,
            student: studentStr,
            timeFrom: lesson.time_from_v.slice(0, 5),
            timeTo: lesson.time_to_v.slice(0, 5),
            startMin: sMin,
            endMin: eMin,
          });
        }
      });

      return lessonsMap;
    }),
  getRemoteCustomers: managerProcedure
    .input(z.object({ alfaTempToken: z.string() }))
    .query(async ({ input }) => {
      const activeCustomers = await fetchAllAlfaPages<any>(
        input.alfaTempToken,
        "https://bridgetoworld.s20.online/v2api/1/customer/index",
        { is_study: 1 }, // Активные клиенты
      );

      const slimCustomers = activeCustomers.map((c) => ({
        id: c.id,
        name: c.name,
        teacher_ids: c.teacher_ids || [],
        is_study: c.is_study ?? 1,
        removed: c.removed ?? 0,
        custom_klass: c.custom_klass || null,
      }));

      return slimCustomers;
    }),
});
