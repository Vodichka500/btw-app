import { router, managerProcedure } from "../trpc";
import { TrashItemInputSchema } from "@btw-app/shared";

export const trashRouter = router({
  // Получить содержимое корзины
  getTrash: managerProcedure.query(async ({ ctx }) => {
    // Prisma позволяет делать параллельные запросы через Promise.all
    const [categories, snippets] = await Promise.all([
      ctx.db.category.findMany({
        where: { deletedAt: { not: null } },
      }),
      ctx.db.snippet.findMany({
        where: { deletedAt: { not: null } },
        include: { category: true }, // Подтягиваем связанную категорию
      }),
    ]);

    return { categories, snippets };
  }),

  restoreItem: managerProcedure
    .input(TrashItemInputSchema)
    .mutation(async ({ ctx, input }) => {
      const { type, id } = input;

      return await ctx.db.$transaction(async (tx) => {
        if (type === "category") {
          const restoredCategory = await tx.category.update({
            where: { id },
            data: { deletedAt: null },
          });

          await tx.snippet.updateMany({
            where: {
              categoryId: id,
              deletedAt: { not: null },
            },
            data: { deletedAt: null },
          });

          return restoredCategory;
        } else {
          return tx.snippet.update({
            where: { id },
            data: { deletedAt: null },
          });
        }
      });
    }),

  // Удалить навсегда один элемент
  hardDeleteItem: managerProcedure
    .input(TrashItemInputSchema)
    .mutation(async ({ ctx, input }) => {
      const { type, id } = input;

      if (type === "category") {
        return ctx.db.category.delete({
          where: { id },
        });
      } else {
        return ctx.db.snippet.delete({
          where: { id },
        });
      }
    }),

  // Очистить всю корзину
  emptyTrash: managerProcedure.mutation(async ({ ctx }) => {
    // Выполняем удаление параллельно для скорости
    // Prisma deleteMany возвращает объект { count: number }
    const [deletedSnips, deletedCats] = await Promise.all([
      ctx.db.snippet.deleteMany({
        where: { deletedAt: { not: null } },
      }),
      ctx.db.category.deleteMany({
        where: { deletedAt: { not: null } },
      }),
    ]);

    return {
      deleted: deletedSnips.count + deletedCats.count,
    };
  }),
});
