import { z } from 'zod'
import { SnippetSchema, CategorySchema } from '../zod/base' // Импорт из сгенерированного файла

// --- READ (Связи) ---
// Сниппет вместе с данными категории
export const SnippetWithCategorySchema = SnippetSchema.extend({
  category: CategorySchema.nullable().optional()
})
export type SnippetWithCategory = z.infer<typeof SnippetWithCategorySchema>

// --- FILTER ---
export const SnippetFilterSchema = z.object({
  search: z.string().optional(),
  categoryId: z.number().optional(),
})
export type SnippetFilter = z.infer<typeof SnippetFilterSchema>

// --- VARIABLES ---
// Описываем структуру одной переменной внутри JSON
const VariableItemSchema = z.object({
  key: z.string().min(1, 'Имя переменной не может быть пустым'),
  hint: z.string().optional() // Подсказка может быть пустой
})

// --- CREATE ---
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
  color: z.string().regex(/^#([0-9A-Fa-f]{3}){1,2}$/, 'Цвет должен быть в формате HEX'),

  // ВАЖНО: Фронтенд шлет массив объектов, а бэкенд переведет это в JSON-строку
  variables: z.array(VariableItemSchema).optional().default([]),

  favorite: z.boolean().default(false)
})
export type CreateSnippetInput = z.infer<typeof CreateSnippetSchema>

// --- UPDATE ---
// Делаем поля необязательными (.partial), но ID обязателен
export const UpdateSnippetSchema = CreateSnippetSchema.partial().extend({
  id: z.number({message: 'ID сниппета обязателен'})
})
export type UpdateSnippetInput = z.infer<typeof UpdateSnippetSchema>
