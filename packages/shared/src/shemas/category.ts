import { z } from 'zod'
import { CategorySchema } from '../zod/base'

// --- READ (Рекурсивный тип) ---
export const CategoryWithChildrenSchema = CategorySchema.extend({
  children: z.array(z.lazy(() => CategoryWithChildrenSchema)).optional().default([])
})
export type CategoryWithChildren = z.infer<typeof CategoryWithChildrenSchema>

// --- CREATE ---
// Берем поля из базы и накидываем сверху строгую валидацию
export const CreateCategorySchema = CategorySchema.pick({
  name: true,
  parentId: true
}).extend({
  name: z
    .string()
    .min(1, 'Название категории не может быть пустым')
    .max(255, 'Название слишком длинное'),
  parentId: z.number().nullable().optional()
})
export type CreateCategoryInput = z.infer<typeof CreateCategorySchema>

// --- UPDATE ---
// Делаем все поля необязательными, но жестко требуем ID из базовой схемы
export const UpdateCategorySchema = CreateCategorySchema.partial().extend({
  id: CategorySchema.shape.id // 🔥 Берем тип ID прямо из родителя!
})
export type UpdateCategoryInput = z.infer<typeof UpdateCategorySchema>

// --- OTHERS ---
// Схема изменения порядка тоже теперь растет из базы!
export const changeOrderCategorySchema = CategorySchema.pick({
  id: true,
  parentId: true,
  order: true
}).extend({
  parentId: z.number().nullable() // Уточняем, что тут может прийти null
})
export type ChangeOrderCategoryInput = z.infer<typeof changeOrderCategorySchema>