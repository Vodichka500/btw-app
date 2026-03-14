import { z } from "zod";
import { CategorySchema, type Category } from "@btw-app/db";

// 1. Создание: берем базовую схему Prisma, выбираем нужные поля
export const CreateCategoryInputSchema = CategorySchema.pick({
  name: true,
  parentId: true,
  order: true,
}).partial({
  parentId: true,
  order: true, // делаем необязательными
});
export type CreateCategoryInput = z.infer<typeof CreateCategoryInputSchema>;

// 2. Обновление: id обязателен, остальное по желанию
export const UpdateCategoryInputSchema = CategorySchema.pick({
  id: true,
  name: true,
  parentId: true,
  order: true,
}).partial({
  name: true,
  parentId: true,
  order: true,
});
export type UpdateCategoryInput = z.infer<typeof UpdateCategoryInputSchema>;

// 3. Изменение структуры (drag & drop)
export const ChangeOrderCategoryInputSchema = z.object({
  id: z.number().int(),
  parentId: z.number().int().nullable(),
  order: z.number().int(),
});
export type ChangeOrderCategoryInput = z.infer<
  typeof ChangeOrderCategoryInputSchema
>;

// 4. Тип для дерева категорий (Рекурсивный тип)
export type CategoryNode = Category & {
  children: CategoryNode[];
};
