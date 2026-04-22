import { router, managerProcedure } from "../trpc";
import { z } from "zod";
import {
  GetBillingLogsInputSchema,
  CreateBillingLogSchema,
} from "@btw-app/shared";

export const billingLogRouter = router({
  get: managerProcedure
    .input(GetBillingLogsInputSchema)
    .query(async ({ ctx, input }) => {
      const logs = await ctx.db.billingLog.findMany({
        where: { month: input.month, year: input.year },
        orderBy: { sentAt: "desc" },
      });

      const alfaIds = [...new Set(logs.map((log) => log.alfaId))];

      const customers = await ctx.db.customer.findMany({
        where: { alfaId: { in: alfaIds } },
        select: { alfaId: true, name: true },
      });

      const customerMap = new Map(customers.map((c) => [c.alfaId, c.name]));

      return logs.map((log) => ({
        ...log,
        customerName: customerMap.get(log.alfaId) || null,
      }));
    }),

  add: managerProcedure
    .input(CreateBillingLogSchema)
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.billingLog.create({
        data: input,
      });
    }),

  delete: managerProcedure
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.billingLog.delete({
        where: { id: input.id },
      });
    }),
});
