import { router, managerProcedure } from "../trpc";
import {
  UpdateCustomerSettingsSchema,
  SynchronizeCustomersInputSchema,
  GetSavedCustomersInputSchema,
} from "@btw-app/shared";

export const customerRouter = router({
  synchronizeCustomers: managerProcedure
    .input(SynchronizeCustomersInputSchema)
    .mutation(async ({ ctx, input }) => {
      const incomingCustomers = input.customers;
      const alfaIds = incomingCustomers.map((c) => c.alfaId);

      const existingDbCustomers = await ctx.db.customer.findMany({
        where: { alfaId: { in: alfaIds } },
        select: { alfaId: true, name: true },
      });

      const existingMap = new Map(
        existingDbCustomers.map((c) => [c.alfaId, c]),
      );

      const missingCustomers: {
        alfaId: number;
        name: string;
        isSelfPaid: boolean;
      }[] = [];
      const customersToUpdate: { alfaId: number; name: string }[] = [];

      for (const incoming of incomingCustomers) {
        const existing = existingMap.get(incoming.alfaId);

        if (!existing) {
          missingCustomers.push({
            alfaId: incoming.alfaId,
            name: incoming.name,
            isSelfPaid: true,
          });
        } else if (existing.name !== incoming.name) {
          customersToUpdate.push({
            alfaId: incoming.alfaId,
            name: incoming.name,
          });
        }
      }

      if (missingCustomers.length > 0) {
        await ctx.db.customer.createMany({
          data: missingCustomers,
        });
      }

      if (customersToUpdate.length > 0) {
        await ctx.db.$transaction(
          customersToUpdate.map((c) =>
            ctx.db.customer.update({
              where: { alfaId: c.alfaId },
              data: { name: c.name },
            }),
          ),
        );
      }

      await ctx.db.syncState.upsert({
        where: { type: "CUSTOMERS" },
        update: { syncedAt: new Date() },
        create: { type: "CUSTOMERS" },
      });

      return await ctx.db.customer.findMany({
        where: { alfaId: { in: alfaIds } },
      });
    }),

  updateSettings: managerProcedure
    .input(UpdateCustomerSettingsSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      return await ctx.db.customer.update({
        where: { id },
        data,
      });
    }),

  getSavedCustomers: managerProcedure
    .input(GetSavedCustomersInputSchema)
    .query(async ({ ctx, input }) => {
      const numSearch = parseInt(input.search || "");
      const where = input.search
        ? {
            OR: [
              {
                name: { contains: input.search, mode: "insensitive" as const },
              },
              ...(isNaN(numSearch) ? [] : [{ alfaId: numSearch }]),
            ],
          }
        : {};

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
