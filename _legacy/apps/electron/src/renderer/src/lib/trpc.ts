import { createTRPCReact } from '@trpc/react-query'
import type { AppRouter } from '@btw-app/server/src/routers'// Типы прямо с сервера (TS позволяет)
import { httpBatchLink } from '@trpc/client'
import { useAuthStore } from '@/store/authStore'

export const trpc = createTRPCReact<AppRouter>()

function getBaseUrl(){
  const url = useAuthStore.getState().serverUrl
  return `${url.replace(/\/$/, '')}/trpc`
}

export const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      // Динамический URL: берем из стора
      url: getBaseUrl(),
      // Хедеры авторизации
      headers() {
        const token = useAuthStore.getState().token
        return {
          Authorization: token ? `Bearer ${token}` : undefined
        }
      }
    })
  ]
})
