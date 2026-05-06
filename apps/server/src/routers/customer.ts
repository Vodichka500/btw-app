import { router, managerProcedure } from "../trpc";
import {
  UpdateCustomerSettingsSchema,
  GetSavedCustomersInputSchema,
  UpdateCustomerNoteSchema,
} from "@btw-app/shared";
import { alfaRouter } from "./alfa/alfa";
import { fetchAllAlfaPages } from "../lib/alfa-helpers";

const arraysEqual = (a: number[], b: number[]) => {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((val, index) => val === sortedB[index]);
};

export const customerRouter = router({
  synchronizeCustomers: managerProcedure.mutation(async ({ ctx }) => {
    const alfaCaller = alfaRouter.createCaller(ctx);
    const token = await alfaCaller.getTempToken();

    // 🔥 1. Выкачиваем клиентов
    const alfaData = await alfaCaller.getRemoteCustomers({
      alfaTempToken: token.token,
    });

    // 🔥 2. Выкачиваем уроки (окно: 1 месяц назад -> 1 месяц вперед)
    const now = new Date();
    const dateFrom = new Date(now.setMonth(now.getMonth() - 1)).toISOString().split("T")[0];
    const dateTo = new Date(now.setMonth(now.getMonth() + 2)).toISOString().split("T")[0]; // +2 потому что мы уже вычли 1

    const recentLessons = await fetchAllAlfaPages<any>(
      token.token,
      "https://bridgetoworld.s20.online/v2api/1/lesson/index",
      { date_from: dateFrom, date_to: dateTo }
    );

    // 🔥 3. Собираем Map: customerAlfaId -> Set<groupAlfaId>
    const customerGroupsMap = new Map<number, Set<number>>();

    recentLessons.forEach((lesson) => {
      // Если это групповой урок
      if (Array.isArray(lesson.group_ids) && lesson.group_ids.length > 0) {
        const groupId = Number(lesson.group_ids[0]);

        if (Array.isArray(lesson.details)) {
          lesson.details.forEach((detail: any) => {
            const customerId = Number(detail.customer_id);
            if (!customerGroupsMap.has(customerId)) {
              customerGroupsMap.set(customerId, new Set());
            }
            customerGroupsMap.get(customerId)!.add(groupId);
          });
        }
      }
    });

    // 🔥 4. Мапим клиентов, приклеивая группы
    const mappedCustomers = alfaData.map((c) => {
      const teachersSet = new Set<number>();
      if (Array.isArray(c.teacher_ids)) {
        c.teacher_ids.forEach((id: any) => teachersSet.add(Number(id)));
      }

      const alfaId = Number(c.id);
      const groupsSet = customerGroupsMap.get(alfaId) || new Set<number>();

      return {
        alfaId,
        name: String(c.name),
        teacherIds: Array.from(teachersSet),
        groupIds: Array.from(groupsSet), // Приклеили группы
        isStudy: typeof c.is_study === "number" ? c.is_study : 1,
        isRemoved: false,
        customClass: c.custom_klass ? String(c.custom_klass).trim() : null,
      };
    });

    // Убираем дубликаты
    const incomingCustomers = Array.from(
      new Map(mappedCustomers.map((c) => [c.alfaId, c])).values(),
    );
    const incomingAlfaIds = incomingCustomers.map((c) => c.alfaId);

    // Достаем базу (добавили groupIds)
    const existingDbCustomers = await ctx.db.customer.findMany({
      select: {
        alfaId: true,
        name: true,
        teacherIds: true,
        groupIds: true, // Достаем группы из БД
        isStudy: true,
        isRemoved: true,
        customClass: true,
      },
    });

    const existingMap = new Map(existingDbCustomers.map((c) => [c.alfaId, c]));
    const dbAlfaIds = Array.from(existingMap.keys());
    const archivedIds = dbAlfaIds.filter((id) => !incomingAlfaIds.includes(id));

    const missingCustomers: any[] = [];
    const customersToUpdate: any[] = [];

    for (const incoming of incomingCustomers) {
      const existing = existingMap.get(incoming.alfaId);

      if (!existing) {
        missingCustomers.push({
          alfaId: incoming.alfaId,
          name: incoming.name,
          isSelfPaid: true,
          teacherIds: incoming.teacherIds,
          groupIds: incoming.groupIds, // Записываем новые
          isStudy: incoming.isStudy,
          isRemoved: false,
          customClass: incoming.customClass,
        });
      } else {
        // 🔥 Проверяем изменения, включая группы
        const hasChanges =
          existing.name !== incoming.name ||
          existing.isStudy !== incoming.isStudy ||
          existing.isRemoved ||
          existing.customClass !== incoming.customClass ||
          !arraysEqual(existing.teacherIds, incoming.teacherIds) ||
          !arraysEqual(existing.groupIds, incoming.groupIds);

        if (hasChanges) {
          customersToUpdate.push({
            alfaId: incoming.alfaId,
            name: incoming.name,
            teacherIds: incoming.teacherIds,
            groupIds: incoming.groupIds, // Обновляем
            isStudy: incoming.isStudy,
            isRemoved: false,
            customClass: incoming.customClass,
          });
        }
      }
    }

    if (missingCustomers.length > 0) {
      await ctx.db.customer.createMany({ data: missingCustomers });
    }

    if (customersToUpdate.length > 0) {
      await ctx.db.$transaction(
        customersToUpdate.map((c) =>
          ctx.db.customer.update({
            where: { alfaId: c.alfaId },
            data: {
              name: c.name,
              teacherIds: c.teacherIds,
              groupIds: c.groupIds,
              isStudy: c.isStudy,
              isRemoved: c.isRemoved,
              customClass: c.customClass,
            },
          }),
        ),
      );
    }

    if (archivedIds.length > 0) {
      await ctx.db.customer.updateMany({
        where: { alfaId: { in: archivedIds } },
        data: { isRemoved: true },
      });
    }

    await ctx.db.syncState.upsert({
      where: { type: "CUSTOMERS" },
      update: { syncedAt: new Date() },
      create: { type: "CUSTOMERS" },
    });

    return { success: true };
  }),
  updateSettings: managerProcedure
    .input(UpdateCustomerSettingsSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.db.customer.update({ where: { id }, data });
    }),

  updateCustomerNote: managerProcedure
    .input(UpdateCustomerNoteSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.db.customer.update({
        where: { id: input.id },
        data: { note: input.note },
      });
    }),

  getSavedCustomers: managerProcedure
    .input(GetSavedCustomersInputSchema)
    .query(async ({ ctx, input }) => {

      const where: any = {
        isRemoved: false,
      };

      if (input.search) {
        const numSearch = parseInt(input.search);
        where.OR = [
          { name: { contains: input.search, mode: "insensitive" } },
          ...(isNaN(numSearch) ? [] : [{ alfaId: numSearch }]),
        ];
      }

      if (input.noClass) {
        where.customClass = null;
      } else if (input.customClass) {
        where.customClass = {
          contains: input.customClass,
          mode: "insensitive",
        };
      }

      if (input.noTeachers) {
        where.teacherIds = { equals: [] };
      } else if (input.teacherId) {
        where.teacherIds = { has: input.teacherId };
      }

      if (input.groupId) {
        where.groupIds = { has: input.groupId };
      }

      const [total, items, syncRecord] = await Promise.all([
        ctx.db.customer.count({ where }),
        ctx.db.customer.findMany({
          where,
          skip: (input.page - 1) * input.limit,
          take: input.limit,
          orderBy: [{ name: "asc" }, { alfaId: "asc" }],
        }),
        ctx.db.syncState.findUnique({
          where: { type: "CUSTOMERS" },
        }),
      ]);

      return {
        items,
        total,
        totalPages: Math.ceil(total / input.limit),
        currentPage: input.page,
        lastSync: syncRecord?.syncedAt || null,
      };
    }),
});
