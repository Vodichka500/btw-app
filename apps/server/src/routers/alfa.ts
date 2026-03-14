import { router, publicProcedure } from "../trpc";
import { z } from "zod";
import { Prisma } from "@btw-app/shared";
import {
  AlfaCrmAuthInputSchema,
  type AlfaUserInfoResponse,
  type AlfaTeacher,
  type GeneralIndexedResponse,
  type ScheduleLesson,
  type AlfaSubject,
} from "@btw-app/shared";

// =========================================
// ВНУТРЕННИЕ ХЕЛПЕРЫ ДЛЯ ALFACRM
// =========================================

async function getAlfaCrmToken(email: string, apiKey: string): Promise<string> {
  const response = await fetch(
    "https://bridgetoworld.s20.online/v2api/auth/login",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, api_key: apiKey }),
    },
  ).then((res) => res.json());

  return response.token;
}

async function getAlfaUserInfoForLogin(
  token: string,
  email: string,
): Promise<AlfaUserInfoResponse> {
  const response = await fetch(
    "https://bridgetoworld.s20.online/v2api/1/user/index",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-ALFACRM-TOKEN": token,
      },
      body: JSON.stringify({ email }),
    },
  ).then((res) => res.json());

  return response;
}

async function makeAlfaCrmAuthRequest<Req, Res>(
  db: any,
  url: string,
  method: string = "POST",
  body: Req,
  retries: number = 3,
): Promise<Res> {
  let user = await db.alfaSettings.findFirst();

  if (!user) {
    throw new Error(
      "Użytkownik nie jest zalogowany w AlfaCRM. Brak danych uwierzytelniających w bazie.",
    );
  }

  if (!user.token || !user.tokenExpiresAt || new Date() > user.tokenExpiresAt) {
    const token = await getAlfaCrmToken(user.email, user.apiKey);
    if (!token) throw new Error("Nie udało się odświeżyć tokena AlfaCRM.");

    const newExpiry = new Date(Date.now() + 3600 * 1000);
    user = await db.alfaSettings.update({
      where: { id: user.id },
      data: { token, tokenExpiresAt: newExpiry },
    });
  }

  const headers = new Headers({
    "Content-Type": "application/json",
    "X-ALFACRM-TOKEN": user.token!,
  });

  try {
    const response = await fetch(url, {
      method,
      headers,
      body: JSON.stringify(body),
    });

    if (response.status === 429 && retries > 0) {
      console.warn(
        `[AlfaCRM] Rate limit 429 hit. Retrying... (${retries} left)`,
      );
      const retryAfter = response.headers.get("Retry-After");
      const waitTime = retryAfter ? parseInt(retryAfter, 10) * 1000 : 2000;
      await new Promise((r) => setTimeout(r, waitTime));
      return makeAlfaCrmAuthRequest(db, url, method, body, retries - 1);
    }

    if (!response.ok && response.status >= 500 && retries > 0) {
      await new Promise((r) => setTimeout(r, 2000));
      return makeAlfaCrmAuthRequest(db, url, method, body, retries - 1);
    }

    if (!response.ok) throw new Error(`AlfaCRM API Error: ${response.status}`);
    return await response.json();
  } catch (error: any) {
    if (retries > 0 && !error.message.includes("nie jest zalogowany")) {
      await new Promise((r) => setTimeout(r, 2000));
      return makeAlfaCrmAuthRequest(db, url, method, body, retries - 1);
    }
    throw error;
  }
}

async function fetchAllAlfaPages<T>(
  db: any,
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
      db,
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
  // 1. Проверка авторизации
  checkAuth: publicProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.alfaSettings.findFirst();
    if (!user) return { isAuth: false };

    try {
      const userSettings = await makeAlfaCrmAuthRequest<
        { email: string },
        AlfaUserInfoResponse
      >(ctx.db, "https://bridgetoworld.s20.online/v2api/1/user/index", "POST", {
        email: user.email,
      });

      if (
        !userSettings ||
        !userSettings.items ||
        userSettings.items.length === 0
      ) {
        await ctx.db.alfaSettings.deleteMany();
        return { isAuth: false };
      }
      return { isAuth: true };
    } catch {
      return { isAuth: false };
    }
  }),

  // 2. Логин
  login: publicProcedure
    .input(AlfaCrmAuthInputSchema)
    .mutation(async ({ ctx, input }) => {
      await ctx.db.alfaSettings.deleteMany();

      const token = await getAlfaCrmToken(input.email, input.apiKey);
      if (!token) {
        throw new Error(
          "Nie udało się uzyskać token AlfaCRM. Sprawdź email i klucz API.",
        );
      }

      const userInfo = await getAlfaUserInfoForLogin(token, input.email);
      if (userInfo.items.length === 0) {
        throw new Error(
          "Nie udało się pobrać informacji o użytkowniku z AlfaCRM.",
        );
      }

      await ctx.db.alfaSettings.create({
        data: {
          id: userInfo.items[0].id,
          email: input.email,
          apiKey: input.apiKey,
          token: token,
          tokenExpiresAt: new Date(Date.now() + 3600 * 1000),
        },
      });

      return true;
    }),

  // 3. Выход
  logout: publicProcedure.mutation(async ({ ctx }) => {
    await ctx.db.alfaSettings.deleteMany();
    return true;
  }),

  // 4. Синхронизация учителей (Стягивание из CRM в БД)
  updateTeachers: publicProcedure.mutation(async ({ ctx }) => {
    const alfaTeachers = await fetchAllAlfaPages<AlfaTeacher>(
      ctx.db,
      "https://bridgetoworld.s20.online/v2api/1/teacher/index",
      { removed: 0 },
    );

    const dbTeachers = await ctx.db.teacher.findMany();
    const dbTeachersMap = new Map(dbTeachers.map((t) => [t.alfacrmId, t]));

    const newTeachers: Prisma.TeacherCreateManyInput[] = [];
    const teachersToUpdate: { id: number; data: Prisma.TeacherUpdateInput }[] =
      [];

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

    // tRPC сам вернет этот объект с правильными типами на фронтенд!
    return {
      status: "success",
      added: newTeachers.length,
      updated: teachersToUpdate.length,
      total: alfaTeachers.length,
    };
  }),

  // 5. Получить расписание учителя (Прямой запрос в CRM)
  getTeacherLessons: publicProcedure
    .input(z.object({ teacherAlfacrmId: z.number().int() }))
    .query(async ({ ctx, input }) => {
      const [regularLessons, alfaSubjects] = await Promise.all([
        fetchAllAlfaPages<ScheduleLesson>(
          ctx.db,
          "https://bridgetoworld.s20.online/v2api/1/regular-lesson/index",
          { teacher_id: input.teacherAlfacrmId },
        ),
        fetchAllAlfaPages<AlfaSubject>(
          ctx.db,
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
          ctx.db,
          "https://bridgetoworld.s20.online/v2api/1/customer/index",
          { id: Array.from(customerIds) },
        );
      }
      if (groupIds.size > 0) {
        groups = await fetchAllAlfaPages<any>(
          ctx.db,
          "https://bridgetoworld.s20.online/v2api/1/group/index",
          { id: Array.from(groupIds) },
        );
      }

      const customerMap = new Map(customers.map((c) => [c.id, c.name]));
      const groupMap = new Map(groups.map((g) => [g.id, g.name]));

      // Мапа, где ключ — день и час ("0-12"), а значение — массив уроков
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
});
