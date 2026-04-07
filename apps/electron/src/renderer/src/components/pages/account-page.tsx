'use client'

import { useAuthStore } from '@/store/authStore'
import { authClient } from '@/lib/auth-client'
import { trpc } from '@/lib/trpc'
import { Button } from '@/components/shared/ui/button'
import { Input } from '@/components/shared/ui/input'
import { Label } from '@/components/shared/ui/label'
import { toast } from 'sonner'
import { Loader2, LogOut, UserCircle, KeySquare, Send } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { UpdateProfileSchema, type UpdateProfileInput } from '@btw-app/shared'

export default function AccountPage() {
  const { user, setAuth, logout } = useAuthStore()

  // Инициализируем react-hook-form с нашей Zod схемой
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<UpdateProfileInput>({
    resolver: zodResolver(UpdateProfileSchema),
    defaultValues: {
      tgChatId: user?.tgChatId || '',
      alfaEmail: user?.alfaEmail || '',
      alfaToken: user?.alfaToken || ''
    }
  })

  // tRPC мутация
  const updateProfile = trpc.user.updateProfile.useMutation({
    onSuccess: async (updatedData) => {
      if (user) {
        setAuth({ ...user, ...updatedData })
      }
      await authClient.getSession({
        fetchOptions: {
          cache: 'reload'
        }
      })
      toast.success('Dane zostały zaktualizowane')
    },
    onError: (err) => {
      toast.error(err.message || 'Wystąpił błąd podczas zapisu')
    }
  })

  // Обработчик, который вызывается только если валидация Zod прошла успешно
  const onSubmit = (data: UpdateProfileInput) => {
    updateProfile.mutate({
      tgChatId: data.tgChatId || null,
      alfaEmail: data.alfaEmail || null,
      alfaToken: data.alfaToken || null
    })
  }

  const handleLogout = async () => {
    await authClient.signOut()
    localStorage.removeItem('session_token')
    logout()
    window.location.reload()
  }

  return (
    <div className="flex-1 overflow-y-auto bg-background p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Konto i ustawienia</h1>
          <p className="text-muted-foreground mt-2">
            Zarządzaj swoimi danymi i integracjami (Telegram, Alfa CRM)
          </p>
        </div>

        <div className="bg-card border rounded-2xl p-6 flex items-center gap-4 shadow-sm">
          <div className="h-16 w-16 bg-primary/10 text-primary flex items-center justify-center rounded-full shrink-0">
            <UserCircle className="h-8 w-8" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold">{user?.name || 'Użytkownik'}</h2>
            <p className="text-muted-foreground">{user?.email}</p>
          </div>
          <div className="text-right">
            <span className="inline-flex items-center rounded-full bg-sidebar-accent px-3 py-1 text-sm font-medium text-sidebar-accent-foreground">
              {user?.role === 'ADMIN' ? 'Administrator' : 'Nauczyciel'}
            </span>
          </div>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="bg-card border rounded-2xl p-6 shadow-sm space-y-6"
        >
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Send className="h-5 w-5 text-muted-foreground" />
            Integracje
          </h3>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tgChatId">Telegram Chat ID</Label>
              <Input
                id="tgChatId"
                placeholder="Np. 123456789"
                {...register('tgChatId')}
                className="max-w-md rounded-xl"
              />
              {errors.tgChatId && (
                <p className="text-xs text-destructive">{errors.tgChatId.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Potrzebne do resetowania hasła i powiadomień przez bota
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="alfaEmail">Alfa CRM Email</Label>
              <Input
                id="alfaEmail"
                type="email"
                placeholder="email@domena.pl"
                {...register('alfaEmail')}
                className="max-w-md rounded-xl"
              />
              {errors.alfaEmail && (
                <p className="text-xs text-destructive">{errors.alfaEmail.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="alfaToken">Alfa CRM Token / API Key</Label>
              <Input
                id="alfaToken"
                type="password"
                placeholder="Wprowadź token"
                {...register('alfaToken')}
                className="max-w-md rounded-xl"
              />
              {errors.alfaToken && (
                <p className="text-xs text-destructive">{errors.alfaToken.message}</p>
              )}
            </div>
          </div>

          <Button type="submit" className="rounded-xl" disabled={updateProfile.isLoading}>
            {updateProfile.isLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <KeySquare className="h-4 w-4 mr-2" />
            )}
            Zapisz zmiany
          </Button>
        </form>

        <div className="bg-destructive/5 border border-destructive/20 rounded-2xl p-6 mt-12 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-destructive">Wyloguj się</h3>
            <p className="text-sm text-muted-foreground">Zakończ sesję na tym urządzeniu</p>
          </div>
          <Button variant="destructive" onClick={handleLogout} className="rounded-xl">
            <LogOut className="h-4 w-4 mr-2" />
            Wyloguj się
          </Button>
        </div>
      </div>
    </div>
  )
}
