import { router, publicProcedure } from "../trpc";
import { z } from "zod";
import {
  CreateCategoryInputSchema,
  UpdateCategoryInputSchema,
  ChangeOrderCategoryInputSchema,
  type CategoryNode,
} from "@btw-app/shared";

// Хелпер для построения дерева оставляем прямо здесь (он не работает с БД напрямую)
const buildCategoryTree = (categories: any[]): CategoryNode[] => {
  const map = new Map<number, CategoryNode>();
  const roots: CategoryNode[] = [];

  categories.forEach((cat) => {
    map.set(cat.id, { ...cat, children: [] });
  });

  categories.forEach((cat) => {
    const node = map.get(cat.id)!;
    if (cat.parentId && map.has(cat.parentId)) {
      map.get(cat.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  });

  return roots;
};

export const categoryRouter = router({
  // Получить дерево категорий
  getAll: publicProcedure.query(async ({ ctx }) => {
    const allCategories = await ctx.db.category.findMany({
      where: { deletedAt: null },
      // Заметил, что в старом коде была сортировка по имени,
      // но для структуры лучше сначала по order, затем по имени
      orderBy: [{ order: "asc" }, { name: "asc" }],
    });

    return buildCategoryTree(allCategories);
  }),

  // Создать категорию
  create: publicProcedure
    .input(CreateCategoryInputSchema)
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db.category.create({
        data: {
          name: input.name,
          parentId: input.parentId ?? null,
          order: input.order ?? 0,
        },
      });
      return result;
    }),

  // Обновить категорию
  update: publicProcedure
    .input(UpdateCategoryInputSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;
      const result = await ctx.db.category.update({
        where: { id },
        data: updateData,
      });
      return result;
    }),

  // Мягкое удаление
  softDelete: publicProcedure
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db.category.update({
        where: { id: input.id },
        data: { deletedAt: new Date() },
      });
      return result;
    }),

  // Массовое обновление структуры (Drag & Drop)
  updateStructure: publicProcedure
    .input(z.array(ChangeOrderCategoryInputSchema))
    .mutation(async ({ ctx, input }) => {
      // Prisma $transaction выполняет массив промисов атомарно
      await ctx.db.$transaction(
        input.map((item) =>
          ctx.db.category.update({
            where: { id: item.id },
            data: {
              parentId: item.parentId,
              order: item.order,
            },
          }),
        ),
      );

      return true;
    }),
});
