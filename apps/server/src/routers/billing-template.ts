import { router, adminProcedure } from "../trpc";
import { z } from "zod";
import {
  CreateBillingTemplateSchema,
  UpdateBillingTemplateSchema,
} from "@btw-app/shared";

export const billingTemplateRouter = router({
  getAll: adminProcedure.query(async ({ ctx }) => {
    return await ctx.db.billingTemplate.findMany({
      orderBy: { createdAt: "desc" },
    });
  }),

  getById: adminProcedure
    .input(z.object({ id: z.number().int() }))
    .query(async ({ ctx, input }) => {
      return await ctx.db.billingTemplate.findUnique({
        where: { id: input.id },
      });
    }),

  create: adminProcedure
    .input(CreateBillingTemplateSchema)
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.billingTemplate.create({
        data: input,
      });
    }),

  update: adminProcedure
    .input(UpdateBillingTemplateSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return await ctx.db.billingTemplate.update({
        where: { id },
        data,
      });
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.billingTemplate.delete({
        where: { id: input.id },
      });
    }),
});
