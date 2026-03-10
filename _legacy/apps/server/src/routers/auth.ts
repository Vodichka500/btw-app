import { router, publicProcedure } from '../trpc/trpc'
import { authCredentialsSchema } from '@btw-app/shared'
import { TRPCError } from '@trpc/server'
import { getDb } from '../../db'
import { users } from '@btw-app/shared'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'



export const authRouter = router({
  // 📝 Регистрация
  register: publicProcedure
    .input(authCredentialsSchema)
    .mutation(async ({ input, ctx }) => {
      const db = await getDb()
      const { email, password } = input

      // 1. Проверяем, есть ли юзер
      const existingUser = await db.select().from(users).where(eq(users.email, email)).get()
      if (existingUser) {
        throw new TRPCError({ code: 'CONFLICT', message: 'User already exists' })
      }

      // 2. Хешируем пароль
      const hashedPassword = await bcrypt.hash(password, 10)

      // 3. Создаем юзера
      const newUser = await db.insert(users).values({
        email,
        passwordHash: hashedPassword,
      }).returning().get()

      if (!newUser) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' })
      }

      // 4. Генерируем токен
      const token = ctx.req.server.jwt.sign({ id: newUser.id, email: newUser.email })

      return { token, user: { id: newUser.id, email: newUser.email } }
    }),

  // 🔑 Логин
  login: publicProcedure
    .input(authCredentialsSchema)
    .mutation(async ({ input, ctx }) => {
      const db = await getDb()
      const { email, password } = input

      const user = await db.select().from(users).where(eq(users.email, email)).get()
      if (!user) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid credentials' })
      }

      const isValidPassword = await bcrypt.compare(password, user.passwordHash)
      if (!isValidPassword) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid credentials' })
      }

      const token = ctx.req.server.jwt.sign({ id: user.id, email: user.email })

      return { token, user: { id: user.id, email: user.email } }
    })
})
