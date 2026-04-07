import { router, adminProcedure } from "../trpc";
import { z } from "zod";

export const customerRouter = router({
  synchronizeCustomers: adminProcedure
    .input(
      z.object({
        customers: z.array(
          z.object({
            alfaId: z.number().int(),
            name: z.string(),
          }),
        ),
      }),
    )
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

  updateSettings: adminProcedure
    .input(
      z.object({
        alfaId: z.number().int(),
        isSelfPaid: z.boolean(),
        studentTgChatId: z.string().nullable(),
        parentTgChatId: z.string().nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { alfaId, ...data } = input;

      return await ctx.db.customer.update({
        where: { alfaId },
        data,
      });
    }),

  getSavedCustomers: adminProcedure
    .input(
      z.object({
        page: z.number().int().min(1).default(1),
        limit: z.number().int().min(1).max(100).default(50),
        search: z.string().optional(),
      }),
    )
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

      // 🔥 Теперь читаем время из SyncState
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
