import { ipcMain } from 'electron'
import { getDb } from '../lib/db'
import { eq, isNotNull } from 'drizzle-orm'
import { categories, snippets } from '@btw-app/shared'
import { RecycleBinItemType } from '@btw-app/shared'
import { Category, Snippet } from '@btw-app/shared'

export const registerTrashHandlers = async (): Promise<void> => {
  const db = await getDb()

  // Получить содержимое корзины
  ipcMain.handle(
    'db:get-trash',
    async (): Promise<{ categories: Category[]; snippets: Snippet[] }> => {
      const trashCategories = await db.query.categories.findMany({
        where: isNotNull(categories.deletedAt)
      })

      const trashSnippets = await db.query.snippets.findMany({
        where: isNotNull(snippets.deletedAt),
        with: { category: true }
      })

      return { categories: trashCategories, snippets: trashSnippets }
    }
  )

  // Восстановить элемент
  ipcMain.handle(
    'db:restore-item',
    async (
      _,
      { type, id }: { type: RecycleBinItemType; id: number }
    ): Promise<Snippet | Category> => {
      if (type === 'category') {
        const res = await db
          .update(categories)
          .set({ deletedAt: null })
          .where(eq(categories.id, id))
          .returning()
        return res[0]
      } else {
        const res = await db
          .update(snippets)
          .set({ deletedAt: null })
          .where(eq(snippets.id, id))
          .returning()
        return res[0]
      }
    }
  )

  // HARD DELETE (Удалить навсегда один элемент)
  ipcMain.handle(
    'db:hard-delete-item',
    async (_, { type, id }: { type: RecycleBinItemType; id: number }) => {
      if (type === 'category') {
        return db.delete(categories).where(eq(categories.id, id)).returning()
      } else {
        return db.delete(snippets).where(eq(snippets.id, id)).returning()
      }
    }
  )

  // Очистить всю корзину
  ipcMain.handle('db:empty-trash', async () => {
    const deletedSnips = await db
      .delete(snippets)
      .where(isNotNull(snippets.deletedAt))
      .returning({ id: snippets.id })

    const deletedCats = await db
      .delete(categories)
      .where(isNotNull(categories.deletedAt))
      .returning({ id: categories.id })

    return { deleted: deletedSnips.length + deletedCats.length }
  })
}
