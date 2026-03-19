import { z } from "zod";
import { SnippetSchema, type Snippet, type Category } from "@btw-app/db/zod";

// 1. Фильтры для запроса (GET)
export const SnippetFilterSchema = z.object({
  categoryId: z.number().int().optional(),
  search: z.string().optional(),
});
export type SnippetFilter = z.infer<typeof SnippetFilterSchema>;

// 2. Создание
export const CreateSnippetInputSchema = SnippetSchema.pick({
  title: true,
  body: true,
  categoryId: true,
  favorite: true,
  color: true,
  order: true,
})
  .partial({
    favorite: true,
    color: true,
    order: true,
  })
  .extend({
    // Фронтенд отправляет JSON-объект/массив, а не строку
    variables: z.any().optional(),
  });
export type CreateSnippetInput = z.infer<typeof CreateSnippetInputSchema>;

// 3. Обновление
export const UpdateSnippetInputSchema = SnippetSchema.pick({
  id: true,
  title: true,
  body: true,
  categoryId: true,
  favorite: true,
  color: true,
  order: true,
})
  .partial({
    title: true,
    body: true,
    categoryId: true,
    favorite: true,
    color: true,
    order: true,
  })
  .extend({
    variables: z.any().optional(),
  });
export type UpdateSnippetInput = z.infer<typeof UpdateSnippetInputSchema>;

// 4. Изменение порядка
export const ReorderSnippetsInputSchema = z.array(
  z.object({
    id: z.number().int(),
    order: z.number().int(),
  }),
);
export type ReorderSnippetsInput = z.infer<typeof ReorderSnippetsInputSchema>;

// 5. Полный тип сниппета с подтянутой категорией
export type SnippetWithCategory = Snippet & {
  category: Category;
};
