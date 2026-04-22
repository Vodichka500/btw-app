import { router, managerProcedure } from "../../trpc";
import { z } from "zod";
import { fetchAllAlfaPages } from "../../lib/alfa-helpers";
import { BillingReportResponse } from "@btw-app/shared";

const billingCache = new Map<string, { data: any, fetchedAt: number }>();
const CACHE_TTL = 1000 * 60 * 30; // 30 минут

export const alfaBilling = router({
  getBillingReport: managerProcedure
    .input(
      z.object({
        alfaTempToken: z.string(),
        month: z.number().int().min(0).max(11),
        year: z.number().int(),
        forceRefresh: z.boolean().optional(),
      }),
    )
    .query(async ({ input }): Promise<BillingReportResponse> => {
      const { alfaTempToken, month, year, forceRefresh } = input;
      const cacheKey = `${month}-${year}`;

      if (!forceRefresh && billingCache.has(cacheKey)) {
        const cached = billingCache.get(cacheKey)!;
        if (Date.now() - cached.fetchedAt < CACHE_TTL) {
          return cached.data;
        }
      }

      const now = new Date();
      const targetFirst = new Date(year, month, 1);
      const targetLast = new Date(year, month + 1, 0);
      const f = (d: Date) => d.toISOString().split("T")[0];

      const [allStudents, allPlannedLessons] = await Promise.all([
        fetchAllAlfaPages<any>(
          alfaTempToken,
          "https://bridgetoworld.s20.online/v2api/1/customer/index",
          { is_study: 1, removed: 0 },
        ),
        fetchAllAlfaPages<any>(
          alfaTempToken,
          "https://bridgetoworld.s20.online/v2api/1/lesson/index",
          {
            date_from: f(now < targetFirst ? now : targetFirst),
            date_to: f(targetLast),
            status: 1, // Только запланированные
          },
        ),
      ]);

      // 🔥 Изменяем структуру lessonStats: теперь subjects это Map (id -> quantity)
      const lessonStats = new Map<
        number,
        {
          costToTarget: number;
          subjects: Map<number, number>;
          targetMonthCost: number;
        }
      >();

      allPlannedLessons.forEach((lesson) => {
        const lessonDate = new Date(lesson.date);
        const isBeforeTarget = lessonDate < targetFirst;
        const isInTarget =
          lessonDate >= targetFirst && lessonDate <= targetLast;

        lesson.details.forEach((det: any) => {
          const cid = det.customer_id;
          const commission = parseFloat(det.commission || 0);

          if (!lessonStats.has(cid)) {
            lessonStats.set(cid, {
              costToTarget: 0,
              subjects: new Map(),
              targetMonthCost: 0,
            });
          }

          const stats = lessonStats.get(cid)!;
          if (isBeforeTarget) stats.costToTarget += commission;
          if (isInTarget) {
            stats.targetMonthCost += commission;

            // 🔥 Увеличиваем счетчик количества занятий по предмету
            const currentQty = stats.subjects.get(lesson.subject_id) || 0;
            stats.subjects.set(lesson.subject_id, currentQty + 1);
          }
        });
      });

      const items = allStudents
        .map((student) => {
          const studentId = student.id;
          const stats = lessonStats.get(studentId) || {
            costToTarget: 0,
            subjects: new Map(),
            targetMonthCost: 0,
          };

          const currentBalance = parseFloat(student.balance || 0);
          const remainderAtStart = currentBalance - stats.costToTarget;
          const totalToPay = stats.targetMonthCost - remainderAtStart;

          return {
            alfaId: studentId,
            name: student.name,
            currentBalance,
            remainderAtStart,
            targetMonthCost: stats.targetMonthCost,
            totalToPay: totalToPay > 0 ? totalToPay : 0,
            // 🔥 Превращаем Map обратно в массив [{id, quantity}]
            subjects: Array.from(stats.subjects.entries()).map(
              ([id, quantity]) => ({
                id,
                quantity,
              }),
            ),
          };
        })
        .filter((item) => item.totalToPay > 0 || item.targetMonthCost > 0)
        .sort((a, b) => b.totalToPay - a.totalToPay);

      const result = {
        items,
        month,
        year,
        fetchedAt: Date.now(),
      };

      billingCache.set(cacheKey, { data: result, fetchedAt: result.fetchedAt });

      return result;
    }),

  getRevenueStats: managerProcedure
    .input(
      z.object({
        alfaTempToken: z.string(),
        month: z.number().int(),
        year: z.number().int(),
      }),
    )
    .query(async ({ input }) => {
      const targetFirst = new Date(input.year, input.month, 1);
      const targetLast = new Date(input.year, input.month + 1, 0);
      const f = (d: Date) => d.toISOString().split("T")[0];

      const lessons = await fetchAllAlfaPages<any>(
        input.alfaTempToken,
        "https://bridgetoworld.s20.online/v2api/1/lesson/index",
        { date_from: f(targetFirst), date_to: f(targetLast), status: 3 },
      );

      const totalRevenue = lessons.reduce((sum, l) => {
        return (
          sum +
          l.details.reduce(
            (s: number, d: any) => s + parseFloat(d.commission || 0),
            0,
          )
        );
      }, 0);

      return { totalRevenue, lessonCount: lessons.length };
    }),
});