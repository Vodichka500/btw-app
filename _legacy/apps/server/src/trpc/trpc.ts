import { initTRPC, TRPCError } from '@trpc/server'
import { Context } from './context'
import { ZodError } from 'zod'

const t = initTRPC.context<Context>().create({
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    }
  },
})

// 1. Middleware для проверки авторизации
const isAuthed = t.middleware(async ({ ctx, next }) => {
  try {
    // Fastify-jwt автоматически добавляет verify в request
    // Токен ожидается в заголовке: Authorization: Bearer <token>
    await ctx.req.jwtVerify()
  } catch (err) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }

  return next({
    ctx: {
      // После проверки в req.user будет лежать payload токена (id, email)
      user: ctx.req.user as { id: number; email: string },
    },
  })
})

// 2. Экспорты процедур
export const router = t.router
export const publicProcedure = t.procedure
export const protectedProcedure = t.procedure.use(isAuthed)
