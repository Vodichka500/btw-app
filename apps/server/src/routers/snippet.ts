import { router, publicProcedure } from "../trpc";
import { z } from "zod";
import {
  SnippetFilterSchema,
  CreateSnippetInputSchema,
  UpdateSnippetInputSchema,
  ReorderSnippetsInputSchema,
} from "@btw-app/shared";

export const snippetRouter = router({
  // Получить сниппеты
  getAll: publicProcedure
    .input(SnippetFilterSchema)
    .query(async ({ ctx, input }) => {
      const { categoryId, search } = input;

      const result = await ctx.db.snippet.findMany({
        where: {
          deletedAt: null,
          // В Prisma undefined игнорируется, поэтому if-ы не нужны!
          categoryId: categoryId ? categoryId : undefined,
          // Поиск с регистронезависимостью
          ...(search
            ? {
                OR: [
                  { title: { contains: search, mode: "insensitive" } },
                  { body: { contains: search, mode: "insensitive" } },
                ],
              }
            : {}),
        },
        include: {
          category: true, // Аналог with в Drizzle
        },
        orderBy: [{ order: "asc" }, { createdAt: "desc" }],
      });

      return result;
    }),

  // Создать сниппет
  create: publicProcedure
    .input(CreateSnippetInputSchema)
    .mutation(async ({ ctx, input }) => {
      const { variables, ...rest } = input;

      const result = await ctx.db.snippet.create({
        data: {
          ...rest,
          variables: variables ? JSON.stringify(variables) : undefined,
        },
      });
      return result;
    }),

  // Обновить сниппет
  update: publicProcedure
    .input(UpdateSnippetInputSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, variables, ...rest } = input;

      const result = await ctx.db.snippet.update({
        where: { id },
        data: {
          ...rest,
          ...(variables !== undefined && {
            variables: JSON.stringify(variables),
          }),
          // 💡 Prisma сама обновит updatedAt, потому что в schema.prisma стоит @updatedAt
        },
      });
      return result;
    }),

  // Мягкое удаление
  softDelete: publicProcedure
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db.snippet.update({
        where: { id: input.id },
        data: { deletedAt: new Date() },
      });
      return result;
    }),

  // Перестановка
  reorder: publicProcedure
    .input(ReorderSnippetsInputSchema)
    .mutation(async ({ ctx, input }) => {
      await ctx.db.$transaction(
        input.map((item) =>
          ctx.db.snippet.update({
            where: { id: item.id },
            data: { order: item.order },
          }),
        ),
      );
      return true;
    }),
});
