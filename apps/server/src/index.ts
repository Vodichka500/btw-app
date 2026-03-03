import 'dotenv/config' // 👈 1. Убедись, что переменные загружены первыми
import { fastifyTRPCPlugin } from '@trpc/server/adapters/fastify'
import fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import { createContext } from './trpc/context'
import { appRouter } from './routers'

const server = fastify({
  maxParamLength: 5000,
  logger: true, // Включи логгер, чтобы видеть ошибки плагинов
})

async function main() {
  try {
    // 2. Регистрируем CORS (если нужен доступ с фронта)
    await server.register(cors, {
      origin: true
    })

    // 3. Регистрируем JWT (ОБЯЗАТЕЛЬНО c await)
    // Используем дефолтный секрет для разработки, если в env пусто
    const secret = process.env.JWT_SECRET || 'dev-secret-key-change-me'

    await server.register(jwt, {
      secret: secret,
    })

    // 4. Регистрируем tRPC (Строго ПОСЛЕ JWT)
    await server.register(fastifyTRPCPlugin, {
      prefix: '/trpc',
      trpcOptions: { router: appRouter, createContext },
    })

    // 5. Запускаем сервер
    await server.listen({ port: 3000, host: '0.0.0.0' })
    console.log('🚀 Server is running on http://localhost:3000')

  } catch (err) {
    server.log.error(err)
    process.exit(1)
  }
}

main()