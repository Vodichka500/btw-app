import { router, protectedProcedure } from '../trpc/trpc'
import { users } from '@btw-app/shared'
import { eq, desc } from 'drizzle-orm'
import { z } from 'zod'
import { getDb } from '../../db'



export const usersRouter = router({
  // Получить всех (только для авторизованных)
  getAll: protectedProcedure.query(async () => {
    const db = await getDb()
    return db
      .select({
        id: users.id,
        email: users.email,
        createdAt: users.createdAt
      })
      .from(users)
      .orderBy(desc(users.createdAt))
      .all()
  }),

  // Удалить юзера
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb()
      await db.delete(users).where(eq(users.id, input.id)).run()
      return { success: true }
    })
})