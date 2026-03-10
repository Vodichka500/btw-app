import { z } from 'zod'
import { SnippetSchema, CategorySchema } from '../zod/base'

// --- READ (Связи) ---
export const SnippetWithCategorySchema = SnippetSchema.extend({
  category: CategorySchema.nullable().optional()
})
export type SnippetWithCategory = z.infer<typeof SnippetWithCategorySchema>

// --- FILTER ---
export const SnippetFilterSchema = z.object({
  search: z.string().optional(),
  categoryId: SnippetSchema.shape.categoryId.optional(), // 🔥 Зависит от базы
})
export type SnippetFilter = z.infer<typeof SnippetFilterSchema>

// --- VARIABLES ---
const VariableItemSchema = z.object({
  key: z.string().min(1, 'Имя переменной не может быть пустым'),
  hint: z.string().optional()
})

// --- CREATE ---
// Собираем фундамент из базы и усиливаем валидацией
export const CreateSnippetSchema = SnippetSchema.pick({
  title: true,
  categoryId: true,
  body: true,
  favorite: true,
  color: true
}).extend({
  title: z.string().min(1, 'Заголовок обязателен'),
  body: z.string().min(1, 'Тело сниппета не может быть пустым'),
  categoryId: z.number({message: 'Категория обязательна'}),
  color: z.string().regex(/^#([0-9A-Fa-f]{3}){1,2}$/, 'Цвет должен быть в формате HEX').optional(),
  variables: z.array(VariableItemSchema).optional().default([]), // Добавляем виртуальное поле
  favorite: z.boolean().default(false)
})
export type CreateSnippetInput = z.infer<typeof CreateSnippetSchema>

// --- UPDATE ---
// Частичный Create + обязательный ID из родителя
export const UpdateSnippetSchema = CreateSnippetSchema.partial().extend({
  id: SnippetSchema.shape.id // 🔥 Берем тип ID прямо из родителя!
})
export type UpdateSnippetInput = z.infer<typeof UpdateSnippetSchema>