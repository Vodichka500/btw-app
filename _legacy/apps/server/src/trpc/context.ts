import { FastifyRequest, FastifyReply } from 'fastify'
import { inferAsyncReturnType } from '@trpc/server'

// Эта функция запускается для каждого запроса
export function createContext({ req, res }: { req: FastifyRequest; res: FastifyReply }) {
  // Мы попробуем достать юзера позже в middleware,
  // но в контекст положим сам запрос, чтобы иметь доступ к заголовкам
  return { req, res }
}

export type Context = inferAsyncReturnType<typeof createContext>
