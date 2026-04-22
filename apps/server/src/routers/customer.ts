import { router, managerProcedure } from "../trpc";
import {
  UpdateCustomerSettingsSchema,
  GetSavedCustomersInputSchema,
  UpdateCustomerNoteSchema,
} from "@btw-app/shared";
import { alfaRouter } from "./alfa/alfa";

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
    const alfaData = await alfaCaller.getRemoteCustomers({
      alfaTempToken: token.token,
    });

    const mappedCustomers = alfaData.map((c) => {
      const teachersSet = new Set<number>();

      if (Array.isArray(c.teacher_ids)) {
        c.teacher_ids.forEach((id: any) => teachersSet.add(Number(id)));
      }

      return {
        alfaId: Number(c.id),
        name: String(c.name),
        teacherIds: Array.from(teachersSet),
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

    const existingDbCustomers = await ctx.db.customer.findMany({
      select: {
        alfaId: true,
        name: true,
        teacherIds: true,
        isStudy: true,
        isRemoved: true,
        customClass: true,
      },
    });

    const existingMap = new Map(existingDbCustomers.map((c) => [c.alfaId, c]));
    const dbAlfaIds = Array.from(existingMap.keys());

    // Логика архива
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
          isStudy: incoming.isStudy,
          isRemoved: false,
          customClass: incoming.customClass,
        });
      } else {
        const hasChanges =
          existing.name !== incoming.name ||
          existing.isStudy !== incoming.isStudy ||
          existing.isRemoved ||
          existing.customClass !== incoming.customClass ||
          !arraysEqual(existing.teacherIds, incoming.teacherIds);

        if (hasChanges) {
          customersToUpdate.push({
            alfaId: incoming.alfaId,
            name: incoming.name,
            teacherIds: incoming.teacherIds,
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

      const [total, items, syncRecord] = await Promise.all([
        ctx.db.customer.count({ where }),
        ctx.db.customer.findMany({
          where,
          skip: (input.page - 1) * input.limit,
          take: input.limit,
          orderBy: { createdAt: "desc" },
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
