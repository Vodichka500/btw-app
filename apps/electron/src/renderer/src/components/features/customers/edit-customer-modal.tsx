'use client'

import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  UpdateCustomerSettingsSchema,
  type UpdateCustomerSettingsInput,
  type CustomerSettingsRow
} from '@btw-app/shared'
import { trpc } from '@/lib/trpc'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/shared/ui/button'
import { Input } from '@/components/shared/ui/input'
import { Label } from '@/components/shared/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/shared/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/shared/ui/select'

type EditModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  customer: CustomerSettingsRow
  onSuccess: () => void
}

export function EditCustomerModal({ open, onOpenChange, customer, onSuccess }: EditModalProps) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors }
  } = useForm<UpdateCustomerSettingsInput>({
    resolver: zodResolver(UpdateCustomerSettingsSchema),
    defaultValues: {
      id: customer.id, // 🔥 Теперь используем наш ID
      isSelfPaid: customer.isSelfPaid,
      studentTgChatId: customer.studentTgChatId || '',
      parentTgChatId: customer.parentTgChatId || ''
    }
  })

  const updateMut = trpc.customer.updateSettings.useMutation({
    onSuccess: () => {
      toast.success('Ustawienia zapisane pomyślnie')
      onOpenChange(false)
      onSuccess()
    },
    onError: (err) => toast.error(err.message)
  })

  const onSubmit = (data: UpdateCustomerSettingsInput) => {
    updateMut.mutate({
      ...data,
      studentTgChatId: data.studentTgChatId?.trim() || null,
      parentTgChatId: data.parentTgChatId?.trim() || null
    })
  }

  const onError = (formErrors: any) => {
    const firstKey = Object.keys(formErrors)[0]
    const firstErrorMsg = formErrors[firstKey]?.message
    toast.error(`Błąd walidacji [${firstKey}]: ${firstErrorMsg || 'Nieprawidłowa wartość'}`)
  }

  const isMutating = updateMut.isPending || updateMut.isLoading

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edytuj: {customer.name}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit, onError)} className="space-y-4 py-4">
          {/* 🔥 Скрытый инпут теперь держит id */}
          <input type="hidden" {...register('id', { valueAsNumber: true })} />

          <div className="space-y-2">
            <Label>Kto opłaca zajęcia?</Label>
            <Controller
              control={control}
              name="isSelfPaid"
              render={({ field }) => (
                <Select
                  onValueChange={(value) => field.onChange(value === 'true')}
                  value={field.value ? 'true' : 'false'}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Wybierz płatnika" />
                  </SelectTrigger>
                  <SelectContent className="z-[100]">
                    <SelectItem value="true">Uczeń płaci sam</SelectItem>
                    <SelectItem value="false">Płaci Rodzic/Opiekun</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.isSelfPaid && (
              <p className="text-xs text-destructive">{errors.isSelfPaid.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Telegram Chat ID Ucznia</Label>
            <Input {...register('studentTgChatId')} placeholder="np. 123456789" />
            {errors.studentTgChatId && (
              <p className="text-xs text-destructive">{errors.studentTgChatId.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Telegram Chat ID Rodzica</Label>
            <Input {...register('parentTgChatId')} placeholder="np. 987654321" />
            {errors.parentTgChatId && (
              <p className="text-xs text-destructive">{errors.parentTgChatId.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Używane do wysyłki rachunków, jeśli uczeń nie płaci sam.
            </p>
          </div>

          <DialogFooter className="pt-4">
            <Button type="submit" disabled={isMutating} className="w-full">
              {isMutating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Zapisz ustawienia
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
