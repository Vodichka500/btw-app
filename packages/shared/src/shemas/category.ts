import { z } from 'zod'
import { CategorySchema } from '@btw-app/shared' // Импорт из сгенерированного файла

// --- READ (Рекурсивный тип) ---
export const CategoryWithChildrenSchema = CategorySchema.extend({
  children: z.array(z.lazy(() => CategoryWithChildrenSchema)).optional().default([])
})
export type CategoryWithChildren = z.infer<typeof CategoryWithChildrenSchema>

// --- CREATE ---
export const CreateCategorySchema = CategorySchema.pick({
  name: true,
  parentId: true // parentId может быть number или null
}).extend({
  name: z
    .string()
    .min(1, 'Название категории не может быть пустым')
    .max(255, 'Название слишком длинное'),
  parentId: z.number().nullable().optional()
})
export type CreateCategoryInput = z.infer<typeof CreateCategorySchema>

// --- UPDATE ---
export const UpdateCategorySchema = CreateCategorySchema.partial().extend({
  id: z.number({message: 'ID категории обязателен'})
})
export type UpdateCategoryInput = z.infer<typeof UpdateCategorySchema>


export const changeOrderCategorySchema = z.object({
  id: z.number(),
  parentId: z.number().nullable(),
  order: z.number()
})
export type ChangeOrderCategoryInput = z.infer<typeof changeOrderCategorySchema>
