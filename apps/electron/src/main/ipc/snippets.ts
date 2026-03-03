import { ipcMain } from 'electron'
import { getDb } from '../lib/db'
import { and, asc, desc, eq, isNull, like, or, SQL } from 'drizzle-orm'
import {
  CreateSnippetInput,
  CreateSnippetSchema,
  Snippet,
  SnippetFilter,
  SnippetFilterSchema,
  snippets,
  SnippetWithCategory,
  UpdateSnippetInput,
  UpdateSnippetSchema
} from '@btw-app/shared'

export const registerSnippetHandlers = async (): Promise<void> => {
  const db = await getDb()

  // Получить сниппеты (с поиском и фильтром)
  ipcMain.handle(
    'db:get-snippets',
    async (_, data: SnippetFilter): Promise<SnippetWithCategory[]> => {
      const { categoryId, search } = SnippetFilterSchema.parse(data)

      const conditions: SQL[] = [isNull(snippets.deletedAt)]

      if (categoryId) {
        conditions.push(eq(snippets.categoryId, categoryId))
      }

      if (search) {
        const searchCondition = or(
          like(snippets.title, `%${search}%`),
          like(snippets.body, `%${search}%`)
        )

        if (searchCondition) {
          conditions.push(searchCondition)
        }
      }

      const result = await db.query.snippets.findMany({
        where: and(...conditions),
        with: { category: true },
        orderBy: [asc(snippets.order), desc(snippets.createdAt)]
      })

      return result as unknown as SnippetWithCategory[]
    }
  )

  // Создать сниппет
  ipcMain.handle('db:create-snippet', async (_, rawData: CreateSnippetInput): Promise<Snippet> => {
    const { variables, ...rest } = CreateSnippetSchema.parse(rawData)
    const result = await db
      .insert(snippets)
      .values({
        ...rest,
        variables: JSON.stringify(variables)
      })
      .returning()

    return result[0]
  })

  // Обновить сниппет
  ipcMain.handle('db:update-snippet', async (_, rawData: UpdateSnippetInput): Promise<Snippet> => {
    const { id, variables, ...rest } = UpdateSnippetSchema.parse(rawData)

    const dataToUpdate: any = { ...rest, updatedAt: new Date() }

    if (variables) {
      dataToUpdate.variables = JSON.stringify(variables)
    }

    const result = await db
      .update(snippets)
      .set(dataToUpdate)
      .where(eq(snippets.id, id))
      .returning()

    return result[0]
  })

  // Мягкое удаление
  ipcMain.handle('db:soft-delete-snippet', async (_, id: number): Promise<Snippet> => {
    const result = await db
      .update(snippets)
      .set({ deletedAt: new Date() })
      .where(eq(snippets.id, id))
      .returning()
    return result[0]
  })

  ipcMain.handle('db:reorder-snippets', async (_, items: { id: number; order: number }[]): Promise<boolean> => {
    await db.transaction(async (tx) => {
      for (const item of items) {
        await tx.update(snippets).set({ order: item.order }).where(eq(snippets.id, item.id)).run() // .run() выполняет запрос синхронно
      }
    })
    return true
  })
}
