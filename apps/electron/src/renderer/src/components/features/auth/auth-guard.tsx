// src/components/auth/auth-guard.tsx
'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'
import { authClient } from '@/lib/auth-client'
import { LoginPage } from '../../pages/login-page'
import { Loader2 } from 'lucide-react'

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isAuthLoading, setAuth } = useAuthStore()

  // Хук от Better Auth, который автоматически следит за куками и сессией
  const { data: session, isPending } = authClient.useSession()

  useEffect(() => {
    if (!isPending) {
      if (session?.user) {
        // Кастуем тип, так как мы точно знаем, что роль вернется (мы настроили это в бэкенде)
        setAuth(session.user as any)
      } else {
        setAuth(null)
      }
    }
  }, [session, isPending, setAuth])

  // Пока проверяем куки на старте — показываем красивый лоадер на весь экран
  if (isPending || isAuthLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground text-sm font-medium animate-pulse">
          Sprawdzanie uprawnień...
        </p>
      </div>
    )
  }

  // Если сессии нет — глухая стена (страница логина)
  if (!isAuthenticated) {
    return <LoginPage />
  }

  // Если всё ок — рендерим приложение
  return <>{children}</>
}
