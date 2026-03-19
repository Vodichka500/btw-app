import { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { httpBatchLink } from '@trpc/client'
import superjson from 'superjson' // 🔥 Тот самый трансформер
import { trpc } from './trpc'

export function TrpcProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())

  const [trpcClient] = useState(() =>
    trpc.createClient({
      transformer: superjson, // 👈 Передаем его в клиент (ошибка TS уйдет)
      links: [
        httpBatchLink({
          url: 'http://localhost:3000/trpc',
          fetch: (url, options) => fetch(url, { ...options, credentials: 'include' })
        })
      ]
    })
  )

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  )
}
