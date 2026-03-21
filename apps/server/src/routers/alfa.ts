import { router, adminProcedure } from "../trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { Prisma } from "@btw-app/db";
import {
  type AlfaTeacher,
  type GeneralIndexedResponse,
  type ScheduleLesson,
  type AlfaSubject,
} from "@btw-app/shared";

// =========================================
// ВНУТРЕННИЕ ХЕЛПЕРЫ ДЛЯ ALFACRM
// =========================================

// 1. Получение временного токена
async function getAlfaCrmToken(email: string, apiKey: string): Promise<string> {
  const response = await fetch(
    "https://bridgetoworld.s20.online/v2api/auth/login",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, api_key: apiKey }),
    },
  );

  if (!response.ok) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Błąd autoryzacji w AlfaCRM. Sprawdź email i klucz API.",
    });
  }

  const data = await response.json();
  return data.token;
}

// 2. Универсальный запрос к AlfaCRM (теперь принимает токен напрямую!)
async function makeAlfaCrmAuthRequest<Req, Res>(
  token: string, 
  url: string,
  method: string = "POST",
  body: Req,
  retries: number = 3,
): Promise<Res> {
  const headers = new Headers({
    "Content-Type": "application/json",
    "X-ALFACRM-TOKEN": token,
  });

  try {
    const response = await fetch(url, {
      method,
      headers,
      body: JSON.stringify(body),
    });

    if (response.status === 401) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Token AlfaCRM wygasł lub jest nieprawidłowy.",
      });
    }

    if (response.status === 429 && retries > 0) {
      console.warn(`[AlfaCRM] Rate limit 429 hit. Retrying... (${retries} left)`);
      const retryAfter = response.headers.get("Retry-After");
      const waitTime = retryAfter ? parseInt(retryAfter, 10) * 1000 : 2000;
      await new Promise((r) => setTimeout(r, waitTime));
      return makeAlfaCrmAuthRequest(token, url, method, body, retries - 1);
    }

    if (!response.ok && response.status >= 500 && retries > 0) {
      await new Promise((r) => setTimeout(r, 2000));
      return makeAlfaCrmAuthRequest(token, url, method, body, retries - 1);
    }

    if (!response.ok) throw new Error(`AlfaCRM API Error: ${response.status}`);
    return await response.json();
  } catch (error: any) {
    if (retries > 0 && !(error instanceof TRPCError)) {
      await new Promise((r) => setTimeout(r, 2000));
      return makeAlfaCrmAuthRequest(token, url, method, body, retries - 1);
    }
    throw error;
  }
}

// 3. Стягивание всех страниц (принимает токен)
async function fetchAllAlfaPages<T>(
  token: string,
  url: string,
  baseParams: any = {},
): Promise<T[]> {
  const allItems: T[] = [];
  let page = 0;
  let fetchedCount = 0;
  let total = 0;
  let res: GeneralIndexedResponse<T>;

  do {
    res = await makeAlfaCrmAuthRequest<any, GeneralIndexedResponse<T>>(
      token,
      url,
      "POST",
      { ...baseParams, page },
    );
    if (!res || !res.items) break;

    allItems.push(...res.items);
    fetchedCount += res.count;
    total = res.total;
    page++;
  } while (fetchedCount < total && res.count > 0);

  return allItems;
}

// 4. Парсинг времени (без изменений)
function parseAlfaTime(timeFrom: string, timeTo: string) {
  const startParts = timeFrom.split(":");
  const endParts = timeTo.split(":");

  const startHour = parseInt(startParts[0], 10);
  const startMin = parseInt(startParts[1], 10);

  let endHour = parseInt(endParts[0], 10);
  let endMin = parseInt(endParts[1], 10);

  if (endMin >= 59) {
    endHour += 1;
    endMin = 0;
  }

  let maxH = endHour;
  if (endMin === 0) maxH -= 1;

  return { startHour, startMin, endHour, endMin, maxH };
}

// =========================================
// РОУТЕР ALFACRM
// =========================================

export const alfaRouter = router({
  // 1. Получить временный токен (Вызывается клиентом)
  getTempToken: adminProcedure.query(async ({ ctx }) => {
    // В Better Auth пользователь лежит в ctx.user
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

  // 2. Синхронизация учителей (Клиент передает временный токен)
  updateTeachers: adminProcedure
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
      const teachersToUpdate: { id: number; data: Prisma.TeacherUpdateInput }[] = [];

      for (const alfa of alfaTeachers) {
        const formattedName = alfa.name;
        const formattedEmail = alfa.email && alfa.email.length > 0 ? alfa.email.join(", ") : null;
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
  getTeacherLessons: adminProcedure
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
        fetchAllAlfaPages<AlfaSubject>(
          alfaTempToken,
          "https://bridgetoworld.s20.online/v2api/1/subject/index",
          { active: true },
        ),
      ]);

      const subjectMap = new Map(alfaSubjects.map((s) => [s.id, s.name]));
      const customerIds = new Set<number>();
      const groupIds = new Set<number>();

      regularLessons.forEach((lesson) => {
        if (lesson.related_class === "Customer") customerIds.add(lesson.related_id);
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

        const subjectName = subjectMap.get(lesson.subject_id) || `Przedmiot ID:${lesson.subject_id}`;
        let studentStr = "";

        if (lesson.related_class === "Group") {
          studentStr = groupMap.get(lesson.related_id) || `Grupa #${lesson.related_id}`;
        }
        if (lesson.related_class === "Customer") {
          studentStr = customerMap.get(lesson.related_id) || `Klient #${lesson.related_id}`;
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
});