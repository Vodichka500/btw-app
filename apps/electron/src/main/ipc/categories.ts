import { ipcMain } from 'electron'
import { getDb } from '../lib/db' // Путь ../lib, т.к. файл внутри папки ipc/
import { eq, isNull, asc } from 'drizzle-orm'
import { categories } from '@btw-app/shared'
import { Category } from '@btw-app/shared'
import {
  CategoryWithChildren,
  ChangeOrderCategoryInput,
  CreateCategoryInput,
  CreateCategorySchema,
  UpdateCategoryInput,
  UpdateCategorySchema
} from '@btw-app/shared'

// HELPER: Построение дерева
const buildCategoryTree = (categories: Category[]): CategoryWithChildren[] => {
  const map = new Map()
  const roots: CategoryWithChildren[] = []

  categories.forEach((cat) => {
    map.set(cat.id, { ...cat, children: [] })
  })

  categories.forEach((cat) => {
    const node = map.get(cat.id)
    if (cat.parentId && map.has(cat.parentId)) {
      map.get(cat.parentId).children.push(node)
    } else {
      roots.push(node)
    }
  })

  return roots
}

export const registerCategoryHandlers = async (): Promise<void> => {
  const db = await getDb()

  // Получить дерево категорий
  ipcMain.handle('db:get-categories', async (): Promise<CategoryWithChildren[]> => {
    const allCategories = await db.query.categories.findMany({
      where: isNull(categories.deletedAt),
      orderBy: [asc(categories.name)]
    })

    return buildCategoryTree(allCategories)
  })

  // Создать категорию
  ipcMain.handle(
    'db:create-category',
    async (_, rawData: CreateCategoryInput): Promise<Category> => {
      const data = CreateCategorySchema.parse(rawData)
      const result = await db
        .insert(categories)
        .values({
          name: data.name,
          parentId: data.parentId ?? null
        })
        .returning()

      return result[0]
    }
  )

  // Обновить категорию
  ipcMain.handle(
    'db:update-category',
    async (_, rawData: UpdateCategoryInput): Promise<Category> => {
      const parsed = UpdateCategorySchema.parse(rawData)
      const { id, ...updateData } = parsed

      const result = await db
        .update(categories)
        .set(updateData)
        .where(eq(categories.id, id))
        .returning()

      return result[0]
    }
  )

  // Мягкое удаление
  ipcMain.handle('db:soft-delete-category', async (_, id: number): Promise<Category> => {
    const result = await db
      .update(categories)
      .set({ deletedAt: new Date() })
      .where(eq(categories.id, id))
      .returning()

    return result[0]
  })

  ipcMain.handle('db:update-category-structure', async (_, updates: ChangeOrderCategoryInput[]) => {
    await db.transaction(async (tx) => {
      for (const item of updates) {
        await tx.update(categories)
          .set({
            parentId: item.parentId,
            order: item.order
          })
          .where(eq(categories.id, item.id))
          .run()
      }
    })

    return true
  })
}
