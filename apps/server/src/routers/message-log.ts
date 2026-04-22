import { router, managerProcedure } from "../trpc";
import { z } from "zod";
import {
  GetMessageLogsInputSchema,
  CreateMessageLogSchema,
} from "@btw-app/shared";

export const messageLogRouter = router({
  get: managerProcedure
    .input(GetMessageLogsInputSchema)
    .query(async ({ ctx, input }) => {
      const where: any = {};

      if (input.status) {
        where.status = input.status;
      }

      if (input.search) {
        const numSearch = parseInt(input.search);
        where.OR = [
          {
            customer: { name: { contains: input.search, mode: "insensitive" } },
          },
          ...(isNaN(numSearch) ? [] : [{ alfaId: numSearch }]),
        ];
      }

      const [total, logs] = await Promise.all([
        ctx.db.messageLog.count({ where }),
        ctx.db.messageLog.findMany({
          where,
          skip: (input.page - 1) * input.limit,
          take: input.limit,
          orderBy: { createdAt: "desc" },
          include: { customer: { select: { name: true } } },
        }),
      ]);

      return {
        items: logs.map((log) => ({
          ...log,
          customerName: log.customer?.name || null,
        })),
        total,
        totalPages: Math.ceil(total / input.limit),
        currentPage: input.page,
      };
    }),

  add: managerProcedure
    .input(CreateMessageLogSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.db.messageLog.create({
        data: input,
      });
    }),

  delete: managerProcedure
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.messageLog.delete({
        where: { id: input.id },
      });
    }),
});
