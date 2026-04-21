import type { AlfaLesson } from "@btw-app/shared";
import { alfaRouter } from "../routers/alfa/alfa";
import { customerRouter } from "../routers/customer";
import { fetchAllAlfaPages } from "./alfa-helpers";
import { Prisma } from "@btw-app/db";

export type TeacherStatsMap = Map<
  number, // teacherAlfaId
  Map<
    string, // groupKey ("INDIVIDUAL" или "GROUP_123")
    Map<number, { attended: number; groupName: string }> // customerAlfaId -> stat
  >
>;

export function aggregateLessons(
  lessons: AlfaLesson[],
  groupMap: Map<number, string>,
  lessonType: "ALL" | "INDIVIDUAL" | "GROUP",
): TeacherStatsMap {
  const teacherStats: TeacherStatsMap = new Map();

  for (const lesson of lessons) {
    if (!lesson.teacher_ids || !lesson.customer_ids) continue;

    const isGroupLesson =
      Array.isArray(lesson.group_ids) && lesson.group_ids.length > 0;

    const groupId = isGroupLesson ? lesson.group_ids[0] : null;

    const groupKey = isGroupLesson ? `GROUP_${groupId}` : "INDIVIDUAL";

    const groupName = isGroupLesson
      ? groupMap.get(groupId!) || `Grupa #${groupId}`
      : "Indywidualne";

    // Фильтрация по типу урока
    if (lessonType === "INDIVIDUAL" && isGroupLesson) continue;
    if (lessonType === "GROUP" && !isGroupLesson) continue;

    // Собираем факты присутствия
    const attendanceMap = new Map<number, boolean>();
    if (Array.isArray(lesson.details)) {
      lesson.details.forEach((d: any) => {
        attendanceMap.set(
          Number(d.customer_id),
          d.is_attend === 1 || d.is_attend === true,
        );
      });
    }

    // Распределяем по учителям, группам и ученикам
    for (const teacherAlfaId of lesson.teacher_ids) {
      if (!teacherStats.has(teacherAlfaId))
        teacherStats.set(teacherAlfaId, new Map());
      const groupsMap = teacherStats.get(teacherAlfaId)!;

      if (!groupsMap.has(groupKey)) groupsMap.set(groupKey, new Map());
      const studentsMap = groupsMap.get(groupKey)!;

      for (const customerAlfaId of lesson.customer_ids) {
        const cId = Number(customerAlfaId);
        // При создании новой записи используем наше актуальное groupName
        const currentStat = studentsMap.get(cId) || { attended: 0, groupName };

        if (attendanceMap.get(cId)) {
          currentStat.attended += 1;
        }

        studentsMap.set(cId, currentStat);
      }
    }
  }

  return teacherStats;
}

export async function fetchAndPrepareReportsData({
  ctx,
  alfaTempToken,
  periodStart,
  periodEnd,
  lessonType,
  existingPairs = new Set<string>(),
}: {
  ctx: any;
  alfaTempToken: string;
  periodStart: string;
  periodEnd: string;
  lessonType: any;
  existingPairs?: Set<string>;
}) {
  // 1. Синхронизация (обновляем учителей и клиентов)
  try {
    const alfaCaller = alfaRouter.createCaller(ctx);
    await alfaCaller.updateTeachers({ alfaTempToken });
    const customerCaller = customerRouter.createCaller(ctx);
    await customerCaller.synchronizeCustomers();
  } catch (error) {
    console.error("Błąd synchronizacji:", error);
  }

  // 2. Достаем актуальный шаблон из БД
  const currentTemplate = await ctx.db.reportTemplate.findUnique({
    where: { id: 1 },
    include: { criteria: true },
  });
  const templateSnapshotData = currentTemplate
    ? currentTemplate
    : Prisma.JsonNull;

  // 3. Запрашиваем уроки и группы из AlfaCRM
  const lessons = await fetchAllAlfaPages<any>(
    alfaTempToken,
    "https://bridgetoworld.s20.online/v2api/1/lesson/index",
    { date_from: periodStart, date_to: periodEnd, status: 3 },
  );

  const groups = await fetchAllAlfaPages<any>(
    alfaTempToken,
    "https://bridgetoworld.s20.online/v2api/1/group/index",
  );

  const groupMap = new Map<number, string>();
  for (const g of groups) {
    groupMap.set(g.id, g.name);
  }

  // 4. Агрегируем статистику
  const teacherStats = aggregateLessons(lessons, groupMap, lessonType);

  // 5. Достаем валидные ID из нашей базы
  const [dbTeachers, dbCustomers] = await Promise.all([
    ctx.db.teacher.findMany({ select: { alfacrmId: true } }),
    ctx.db.customer.findMany({ select: { alfaId: true } }),
  ]);

  const validTeacherAlfaIds = new Set(dbTeachers.map((t: any) => t.alfacrmId));
  const validCustomerAlfaIds = new Set(dbCustomers.map((c: any) => c.alfaId));

  const reportsToCreate: Array<{
    teacherId: number;
    studentId: number;
    lessonsAttended: number;
    groupName: string;
    status: "PENDING";
    templateSnapshot: any;
  }> = [];

  const missingTeachers = new Set<number>();
  const missingCustomers = new Set<number>();

  // 6. Формируем список отчетов на создание
  for (const [teacherAlfaId, groupsMap] of teacherStats.entries()) {
    if (!validTeacherAlfaIds.has(teacherAlfaId)) {
      missingTeachers.add(teacherAlfaId);
      continue;
    }

    for (const [_, studentsMap] of groupsMap.entries()) {
      for (const [customerAlfaId, stats] of studentsMap.entries()) {
        if (!validCustomerAlfaIds.has(customerAlfaId)) {
          missingCustomers.add(customerAlfaId);
          continue;
        }

        if (existingPairs.has(`${teacherAlfaId}_${customerAlfaId}`)) {
          continue;
        }

        reportsToCreate.push({
          teacherId: teacherAlfaId,
          studentId: customerAlfaId,
          lessonsAttended: stats.attended,
          groupName: stats.groupName,
          status: "PENDING" as const,
          templateSnapshot: templateSnapshotData,
        });
      }
    }
  }

  return {
    reportsBase: reportsToCreate,
    missingTeachers: Array.from(missingTeachers),
    missingCustomers: Array.from(missingCustomers),
  };
}