'use client'

import { useState } from 'react'
import { authClient } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Lock } from 'lucide-react'
import { toast } from 'sonner'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleCreateAdmin = async () => {
    setLoading(true)
    try {
      const { data, error } = await authClient.signUp.email({
        email: 'admin@btw.com', // Твой email
        password: 'admin123', // Твой пароль
        name: 'Główny Admin',
        role: 'ADMIN' // Передаем нашу кастомную роль
      })

      if (error) {
        toast.error(error.message || 'Błąd podczas tworzenia admina')
      } else {
        toast.success('Admin utworzony! Możesz się teraz zalogować.')
        // Автоматически подставим данные в форму для удобства
        setEmail('admin@btw.com')
        setPassword('admin')
      }
    } catch (err) {
      toast.error('Wystąpił błąd sieci')
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await authClient.signIn.email({
        email,
        password
      })

      if (error) {
        toast.error(error.message || 'Błąd logowania. Sprawdź dane.')
      } else {
        toast.success('Zalogowano pomyślnie!')
        // AuthGuard сам заметит изменение сессии и пустит нас дальше
      }
    } catch (err) {
      toast.error('Wystąpił nieoczekiwany błąd.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-8 bg-card p-8 rounded-3xl border shadow-sm">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-primary/10 text-primary flex items-center justify-center rounded-2xl mb-4">
            <Lock className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Zaloguj się</h2>
          <p className="text-sm text-muted-foreground mt-2">
            Wprowadź swoje dane, aby uzyskać dostęp
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Hasło</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="rounded-xl"
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full rounded-xl h-11"
            disabled={loading || !email || !password}
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Zaloguj się'}
          </Button>

          {/* 🔥 ВРЕМЕННАЯ КНОПКА (Удали после первого использования!) */}
          <Button
            type="button"
            variant="outline"
            className="w-full rounded-xl h-11 border-dashed text-muted-foreground"
            onClick={handleCreateAdmin}
            disabled={loading}
          >
            Stwórz pierwszego Admina (Test)
          </Button>
        </form>
      </div>
    </div>
  )
}
