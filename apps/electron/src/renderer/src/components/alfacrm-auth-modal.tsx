'use client'

import React, { useState } from 'react'
import { KeyRound, Loader2 } from 'lucide-react'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { AlfaCrmAuthSchema, AlfaCrmAuthInput } from '@btw-app/shared'

interface AlfacrmAuthModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (data: AlfaCrmAuthInput) => Promise<void>
}

const AlfacrmAuthModal = ({ open, onOpenChange, onSave }: AlfacrmAuthModalProps) => {
  // 1. Локальный стейт для значений, ошибок и загрузки
  const [email, setEmail] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [errors, setErrors] = useState<{ email?: string; apiKey?: string }>({})
  const [isLoading, setIsLoading] = useState(false)

  // 2. Обработчик закрытия/открытия (сброс стейта)
  const handleOpenChange = (isOpen: boolean) => {
    // Блокируем закрытие, если идет загрузка
    if (isLoading) return

    if (!isOpen) {
      setEmail('')
      setApiKey('')
      setErrors({})
    }
    onOpenChange(isOpen)
  }

  // 3. Обработчик сабмита с асинхронным вызовом
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Проверяем данные через Zod
    const result = AlfaCrmAuthSchema.safeParse({ email, apiKey })

    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors
      setErrors({
        email: fieldErrors.email?.[0],
        apiKey: fieldErrors.apiKey?.[0]
      })
      return
    }

    setErrors({})
    setIsLoading(true)

    try {
      // Ждем ответа от сервера (родительский компонент сам закроет модалку при успехе)
      await onSave(result.data)
    } finally {
      // Снимаем спиннер (сработает, если сервер вернул ошибку и модалка осталась открытой)
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px] text-foreground">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-primary" />
            Podłączenie AlfaCRM
          </DialogTitle>
          <DialogDescription>
            Wprowadź swój e-mail i klucz API, aby zintegrować się z platformą.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 pt-4">
          {/* Поле Email */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="email" className={errors.email ? 'text-destructive' : ''}>
              E-mail
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="admin@example.com"
              value={email}
              disabled={isLoading}
              onChange={(e) => {
                setEmail(e.target.value)
                if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }))
              }}
            />
            {errors.email && <p className="text-sm font-medium text-destructive">{errors.email}</p>}
          </div>

          {/* Поле API Key */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="apiKey" className={errors.apiKey ? 'text-destructive' : ''}>
              Klucz API
            </Label>
            <Input
              id="apiKey"
              type="password"
              placeholder="Wpisz swój klucz API..."
              value={apiKey}
              disabled={isLoading}
              onChange={(e) => {
                setApiKey(e.target.value)
                if (errors.apiKey) setErrors((prev) => ({ ...prev, apiKey: undefined }))
              }}
            />
            {errors.apiKey && (
              <p className="text-sm font-medium text-destructive">{errors.apiKey}</p>
            )}
          </div>

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isLoading}
            >
              Anuluj
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Zapisz
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default AlfacrmAuthModal
