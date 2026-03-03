import { protectedProcedure, publicProcedure, router } from '../trpc/trpc'
import { authRouter } from './auth'
import { usersRouter } from './users'

export const appRouter = router({
  auth: authRouter,
  users: usersRouter,
  hello: router({
    world: publicProcedure
      .query(() =>  'Hello, world!')
  }),
  protectedHello: router({
    world: protectedProcedure
    .query(() =>  'Hello, world!')
  })
})

export type AppRouter = typeof appRouter