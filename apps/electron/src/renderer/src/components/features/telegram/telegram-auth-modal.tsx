'use client'

import { useState, useEffect, useRef } from 'react'
import { Dialog, DialogContent } from '@/components/shared/ui/dialog'
import { Button } from '@/components/shared/ui/button'
import { Input } from '@/components/shared/ui/input'
import { Label } from '@/components/shared/ui/label'
import { cn } from '@/lib/utils'
import { trpc } from '@/lib/trpc'
import {
  Send,
  Phone,
  KeyRound,
  ShieldCheck,
  ArrowRight,
  Loader2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'

type AuthStep = 'phone' | 'code' | 'password' | 'success'

interface TelegramAuthModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function TelegramAuthModal({ isOpen, onClose, onSuccess }: TelegramAuthModalProps) {
  const [step, setStep] = useState<AuthStep>('phone')
  const [error, setError] = useState<string | null>(null)

  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')

  const phoneRef = useRef<HTMLInputElement>(null)
  const codeRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)

  // 🔥 tRPC мутации
  const sendCodeMut = trpc.telegram.sendCode.useMutation()
  const submitCodeMut = trpc.telegram.submitCode.useMutation()
  const submitPasswordMut = trpc.telegram.submitPassword.useMutation()

  const isLoading = sendCodeMut.isPending || submitCodeMut.isPending || submitPasswordMut.isPending

  useEffect(() => {
    if (!isOpen) {
      const timer = setTimeout(() => {
        setStep('phone')
        setPhone('')
        setCode('')
        setPassword('')
        setError(null)
        sendCodeMut.reset()
        submitCodeMut.reset()
        submitPasswordMut.reset()
      }, 300)
      return () => clearTimeout(timer)
    }
    return () => {}
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const timer = setTimeout(() => {
      if (step === 'phone') phoneRef.current?.focus()
      if (step === 'code') codeRef.current?.focus()
      if (step === 'password') passwordRef.current?.focus()
    }, 400)
    return () => clearTimeout(timer)
  }, [step, isOpen])

  const handleInput = (setter: (val: string) => void, val: string) => {
    setError(null)
    setter(val)
  }

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    try {
      await sendCodeMut.mutateAsync({ phone: phone.replace(/\s/g, '') })
      setStep('code')
    } catch (err: any) {
      setError(err.message || 'Wystąpił błąd podczas wysyłania kodu')
    }
  }

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    try {
      const res = await submitCodeMut.mutateAsync({ code: code.trim() })
      if (res.status === 'NEEDS_PASSWORD') {
        setStep('password')
      } else {
        setStep('success')
      }
    } catch (err: any) {
      setError(err.message || 'Nieprawidłowy kod')
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    try {
      await submitPasswordMut.mutateAsync({ password: password.trim() })
      setStep('success')
    } catch (err: any) {
      setError(err.message || 'Nieprawidłowe hasło')
    }
  }

  const finishAuth = () => {
    onSuccess()
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[400px] p-0 overflow-hidden rounded-2xl bg-card border-border">
        <div className="relative min-h-[440px] flex items-center justify-center p-8">
          {/* KROK 1: TELEFON */}
          <div
            className={`absolute inset-0 p-8 flex flex-col justify-center transition-all duration-500 ease-in-out ${
              step === 'phone'
                ? 'opacity-100 translate-x-0 pointer-events-auto'
                : 'opacity-0 -translate-x-12 pointer-events-none'
            }`}
          >
            <div className="w-16 h-16 bg-[#2AABEE]/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Send className="w-8 h-8 text-[#2AABEE] ml-1" />
            </div>
            <h3 className="text-xl font-bold text-center mb-2">Zaloguj do Telegrama</h3>
            <p className="text-sm text-center text-muted-foreground mb-6">
              Podaj numer telefonu w formacie międzynarodowym (np. +48123456789).
            </p>

            <form onSubmit={handlePhoneSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Numer telefonu</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    ref={phoneRef}
                    disabled={isLoading || step !== 'phone'}
                    value={phone}
                    onChange={(e) => handleInput(setPhone, e.target.value)}
                    placeholder="+48 000 000 000"
                    className={cn(
                      'pl-9 rounded-xl bg-secondary transition-colors',
                      error && 'border-destructive focus-visible:ring-destructive'
                    )}
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2 p-3 bg-destructive/10 text-destructive rounded-xl text-sm animate-in fade-in slide-in-from-top-1">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="leading-tight">{error}</span>
                </div>
              )}

              <Button
                type="submit"
                disabled={isLoading || phone.length < 5 || step !== 'phone'}
                className="w-full rounded-xl bg-[#2AABEE] hover:bg-[#2298D6] text-white"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Dalej'}
              </Button>
            </form>
          </div>

          {/* KROK 2: KOD SMS/TG */}
          <div
            className={`absolute inset-0 p-8 flex flex-col justify-center transition-all duration-500 ease-in-out ${
              step === 'code'
                ? 'opacity-100 translate-x-0 pointer-events-auto'
                : step === 'phone'
                  ? 'opacity-0 translate-x-12 pointer-events-none'
                  : 'opacity-0 -translate-x-12 pointer-events-none'
            }`}
          >
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShieldCheck className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-bold text-center mb-2">Wpisz kod</h3>
            <p className="text-sm text-center text-muted-foreground mb-6">
              Wysłaliśmy kod na numer{' '}
              <span className="font-medium text-foreground">{phone || '+48...'}</span> w aplikacji
              Telegram.
            </p>
            <form onSubmit={handleCodeSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Kod weryfikacyjny</Label>
                <Input
                  ref={codeRef}
                  disabled={isLoading || step !== 'code'}
                  value={code}
                  onChange={(e) => handleInput(setCode, e.target.value)}
                  placeholder="12345"
                  className={cn(
                    'text-center tracking-[0.5em] text-lg rounded-xl bg-secondary transition-colors',
                    error && 'border-destructive focus-visible:ring-destructive'
                  )}
                  maxLength={5}
                />
              </div>

              {error && (
                <div className="flex items-start gap-2 p-3 bg-destructive/10 text-destructive rounded-xl text-sm animate-in fade-in slide-in-from-top-1">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="leading-tight">{error}</span>
                </div>
              )}

              <Button
                type="submit"
                disabled={isLoading || code.length < 5 || step !== 'code'}
                className="w-full rounded-xl"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Potwierdź'}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setStep('phone')
                  setError(null)
                }}
                disabled={isLoading || step !== 'code'}
                className="w-full rounded-xl text-muted-foreground"
              >
                Zmień numer
              </Button>
            </form>
          </div>

          {/* KROK 3: HASŁO 2FA */}
          <div
            className={`absolute inset-0 p-8 flex flex-col justify-center transition-all duration-500 ease-in-out ${
              step === 'password'
                ? 'opacity-100 translate-x-0 pointer-events-auto'
                : step === 'success'
                  ? 'opacity-0 -translate-x-12 pointer-events-none'
                  : 'opacity-0 translate-x-12 pointer-events-none'
            }`}
          >
            <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <KeyRound className="w-8 h-8 text-amber-500" />
            </div>
            <h3 className="text-xl font-bold text-center mb-2">Weryfikacja dwuetapowa</h3>
            <p className="text-sm text-center text-muted-foreground mb-6">
              Twoje konto jest chronione hasłem. Wprowadź je, aby kontynuować.
            </p>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Hasło do chmury (2FA)</Label>
                <Input
                  ref={passwordRef}
                  disabled={isLoading || step !== 'password'}
                  type="password"
                  value={password}
                  onChange={(e) => handleInput(setPassword, e.target.value)}
                  placeholder="••••••••"
                  className={cn(
                    'rounded-xl bg-secondary transition-colors',
                    error && 'border-destructive focus-visible:ring-destructive'
                  )}
                />
              </div>

              {error && (
                <div className="flex items-start gap-2 p-3 bg-destructive/10 text-destructive rounded-xl text-sm animate-in fade-in slide-in-from-top-1">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="leading-tight">{error}</span>
                </div>
              )}

              <Button
                type="submit"
                disabled={isLoading || password.length === 0 || step !== 'password'}
                className="w-full rounded-xl"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Zaloguj'}
              </Button>
            </form>
          </div>

          {/* KROK 4: SUKCES */}
          <div
            className={`absolute inset-0 p-8 flex flex-col justify-center items-center transition-all duration-500 ease-in-out ${
              step === 'success'
                ? 'opacity-100 translate-x-0 pointer-events-auto scale-100'
                : 'opacity-0 translate-x-12 pointer-events-none scale-95'
            }`}
          >
            <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 className="w-10 h-10 text-emerald-500" />
            </div>
            <h3 className="text-2xl font-bold text-center mb-2">Gotowe!</h3>
            <p className="text-sm text-center text-muted-foreground mb-8">
              Pomyślnie zalogowano do Telegrama. Możesz teraz wysyłać automatyczne powiadomienia.
            </p>
            <Button
              onClick={finishAuth}
              className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Zakończ <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
