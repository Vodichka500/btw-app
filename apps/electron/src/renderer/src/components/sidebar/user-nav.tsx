import { useState } from 'react'
import { trpc } from '@/lib/trpc'
import { useAuthStore } from '@/store/authStore'
import { Cloud, LogOut, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

// Простой UI для Диалога и Поповера (если нет shadcn/ui, используем нативный HTML style + Tailwind)
// Если у тебя настроен shadcn, замени эти div-ы на компоненты Dialog* и Popover*

export function UserNav({ isCollapsed }: { isCollapsed: boolean }) {
  const { token, user, serverUrl, setServerUrl, setAuth, logout } = useAuthStore()
  const [isOpen, setIsOpen] = useState(false)
  const [mode, setMode] = useState<'login' | 'register'>('login')

  // Form states
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [tempUrl, setTempUrl] = useState(serverUrl)

  const utils = trpc.useUtils()

  const loginMutation = trpc.auth.login.useMutation()

  const registerMutation = trpc.auth.register.useMutation()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setServerUrl(tempUrl) // Сохраняем URL перед запросом

    if (mode === 'login') {
      loginMutation.mutate({ email, password }, {
        onSuccess: (data) => {
          setAuth(data.token, data.user)
          setIsOpen(false)
          setEmail('')
          setPassword('')
        },
        onError: (e) => alert(e.message) // Лучше заменить на toast
      })
    } else {
      registerMutation.mutate(
        { email, password },
        {
          onSuccess: (data) => {
            setAuth(data.token, data.user)
            setIsOpen(false)
            utils.users.getAll.invalidate()
          },
          onError: (e) => alert(e.message)
        }
      )
    }
  }

  const isLoading = loginMutation.isPending || registerMutation.isPending

  // --- STATE 1: LOGGED IN ---
  if (token && user) {
    return (
      <div className="relative group">
        {/* Кнопка пользователя */}
        <Button
          variant="ghost"
          className={cn(
            'w-full rounded-xl text-sidebar-foreground hover:bg-sidebar-accent h-12',
            isCollapsed ? 'justify-center px-0' : 'justify-start gap-3 px-3'
          )}
          onClick={() => {
            if (confirm('Wylogować się z konta?')) logout()
          }}
          title={user.email}
        >
          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 shrink-0 font-semibold border border-blue-200">
            {user.email[0].toUpperCase()}
          </div>

          {!isCollapsed && (
            <div className="flex flex-col items-start truncate text-left">
              <span className="text-sm font-medium truncate w-full">{user.email}</span>
              <span className="text-xs text-sidebar-foreground/50">Dostępny</span>
            </div>
          )}

          {!isCollapsed && <LogOut className="h-4 w-4 ml-auto text-sidebar-foreground/40" />}
        </Button>
      </div>
    )
  }

  // --- STATE 2: LOGGED OUT (Login Dialog) ---
  return (
    <>
      <Button
        variant="ghost"
        className={cn(
          'w-full rounded-xl text-sidebar-foreground hover:bg-sidebar-accent',
          isCollapsed ? 'justify-center px-0' : 'justify-start gap-3'
        )}
        onClick={() => setIsOpen(true)}
        title="Połącz z chmurą"
      >
        <Cloud className="h-4 w-4 shrink-0" />
        {!isCollapsed && <span>Połącz z chmurą</span>}
      </Button>

      {/* MODAL OVERLAY (Самописный, чтобы не зависеть от библиотек UI пока что) */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 border border-zinc-200 dark:border-zinc-800">
            {/* Header */}
            <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
              <h2 className="text-lg font-semibold text-center">
                {mode === 'login' ? 'Witaj ponownie' : 'Załóż konto'}
              </h2>
              <p className="text-xs text-center text-zinc-500">
                Synchronizuj snippety między urządzeniami
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-zinc-500 uppercase">URL serwera</label>
                <input
                  className="w-full px-3 py-2 text-sm border rounded-md bg-transparent dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={tempUrl}
                  onChange={(e) => setTempUrl(e.target.value)}
                  placeholder="http://localhost:3000"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-zinc-500 uppercase">
                  Dane logowania
                </label>
                <input
                  className="w-full px-3 py-2 text-sm border rounded-md bg-transparent dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="name@example.com"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <input
                  className="w-full px-3 py-2 text-sm border rounded-md bg-transparent dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Hasło"
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <Button type="submit" className="w-full mt-2" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {mode === 'login' ? 'Zaloguj się' : 'Załóż konto'}
              </Button>
            </form>

            {/* Footer */}
            <div className="p-4 bg-zinc-50 dark:bg-zinc-900 border-t border-zinc-100 dark:border-zinc-800 text-center text-sm">
              <span className="text-zinc-500">
                {mode === 'login' ? 'Nie masz konta? ' : 'Masz już konto? '}
              </span>
              <button
                type="button"
                className="font-medium text-blue-600 hover:underline"
                onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
              >
                {mode === 'login' ? 'Zarejestruj się' : 'Zaloguj się'}
              </button>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-2 right-2 p-2 hover:bg-black/5 rounded-full"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </>
  )
}
