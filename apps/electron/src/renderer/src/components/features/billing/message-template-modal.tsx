'use client'

import { useRef, useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/shared/ui/dialog'
import { Label } from '@/components/shared/ui/label'
import { Input } from '@/components/shared/ui/input'
import { Textarea } from '@/components/shared/ui/textarea'
import { Badge } from '@/components/shared/ui/badge'
import { Button } from '@/components/shared/ui/button'
import { toast } from 'sonner'
import { trpc } from '@/lib/trpc'
import { type BillingTemplate } from '@btw-app/shared'

type LocalTemplateState = {
  id?: number
  name: string
  body: string
}

interface MessageTemplateModalProps {
  isOpen: boolean
  onClose: () => void
  templateToEdit: BillingTemplate | null
}

export default function MessageTemplateModal({
  isOpen,
  onClose,
  templateToEdit
}: MessageTemplateModalProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const [localTemplate, setLocalTemplate] = useState<LocalTemplateState | null>(null)

  const trpcUtils = trpc.useUtils()

  const createMut = trpc.billingTemplate.create.useMutation({
    onSuccess: () => {
      toast.success('Szablon został utworzony')
      trpcUtils.billingTemplate.getAll.invalidate().then()
      onClose()
    }
  })

  const updateMut = trpc.billingTemplate.update.useMutation({
    onSuccess: () => {
      toast.success('Szablon został zaktualizowany')
      trpcUtils.billingTemplate.getAll.invalidate().then()
      onClose()
    }
  })

  const deleteMut = trpc.billingTemplate.delete.useMutation({
    onSuccess: () => {
      toast.success('Szablon został usunięty')
      trpcUtils.billingTemplate.getAll.invalidate().then()
      onClose()
    }
  })

  const isSaving = createMut.isPending || updateMut.isPending
  const isDeleting = deleteMut.isPending

  useEffect(() => {
    if (isOpen) {
      setLocalTemplate(templateToEdit ? { ...templateToEdit } : { name: '', body: '' })
    } else {
      setLocalTemplate(null)
    }
  }, [isOpen, templateToEdit])

  const insertVariable = (variable: string) => {
    if (!textareaRef.current || !localTemplate) return
    const textarea = textareaRef.current
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const currentBody = localTemplate.body
    const newBody = currentBody.substring(0, start) + variable + currentBody.substring(end)

    setLocalTemplate({ ...localTemplate, body: newBody })

    // Return focus to textarea after insertion
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + variable.length, start + variable.length)
    }, 0)
  }

  const handleSaveClick = () => {
    if (!localTemplate?.name?.trim() || !localTemplate?.body?.trim()) {
      toast.error('Wypełnij wszystkie pola')
      return
    }

    // 🔥 3. TypeScript now knows localTemplate has name and body, and id is optional
    if (localTemplate.id) {
      updateMut.mutate({
        id: localTemplate.id,
        name: localTemplate.name,
        body: localTemplate.body
      })
    } else {
      createMut.mutate({
        name: localTemplate.name,
        body: localTemplate.body
      })
    }
  }

  const handleDeleteClick = () => {
    if (localTemplate?.id) {
      deleteMut.mutate({ id: localTemplate.id })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[1200px] bg-card border-border rounded-2xl">
        <DialogHeader>
          <DialogTitle>{localTemplate?.id ? 'Edytuj szablon' : 'Nowy szablon'}</DialogTitle>
        </DialogHeader>

        {localTemplate && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nazwa szablonu</Label>
              <Input
                value={localTemplate.name}
                onChange={(e) => setLocalTemplate({ ...localTemplate, name: e.target.value })}
                placeholder="np. Przypomnienie o płatności"
                className="bg-secondary rounded-xl"
              />
            </div>

            <div className="grid grid-cols-[2fr_300px] gap-6">
              <div className="space-y-2 flex flex-col">
                <Label>Treść wiadomości</Label>
                <Textarea
                  ref={textareaRef}
                  value={localTemplate.body}
                  onChange={(e) => setLocalTemplate({ ...localTemplate, body: e.target.value })}
                  placeholder="Wpisz treść wiadomości..."
                  className="flex-1 min-h-[450px] bg-secondary resize-none font-mono text-[15px] rounded-xl leading-relaxed p-4"
                />
              </div>

              <div className="space-y-3">
                <Label>Zmienne (Kliknij, aby wstawić)</Label>
                <div className="rounded-xl border bg-secondary p-4 space-y-4 h-full">
                  <div>
                    <h4 className="text-xs font-bold text-muted-foreground uppercase mb-2">
                      Dane ogólne
                    </h4>
                    <div className="flex flex-col gap-2">
                      <Badge
                        variant="outline"
                        className="cursor-pointer justify-start bg-card hover:bg-muted py-1.5"
                        onClick={() => insertVariable('{{name}}')}
                      >
                        <span className="font-mono text-primary mr-2">{'{{name}}'}</span> Imię
                        ucznia
                      </Badge>
                      <Badge
                        variant="outline"
                        className="cursor-pointer justify-start bg-card hover:bg-muted py-1.5"
                        onClick={() => insertVariable('{{amount}}')}
                      >
                        <span className="font-mono text-primary mr-2">{'{{amount}}'}</span> Kwota
                        (PLN)
                      </Badge>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-muted-foreground uppercase mb-2">
                      Przedmioty (Pętla)
                    </h4>
                    <p className="text-xs text-muted-foreground mb-2 leading-tight">
                      Użyj tego bloku, aby wylistować przedmioty i liczbę lekcji.
                    </p>
                    <div className="flex flex-col gap-2">
                      <Badge
                        variant="default"
                        className="cursor-pointer justify-center py-2"
                        onClick={() =>
                          insertVariable(
                            '{{#each subjects}}\n- {{subject_name}} ({{quantity}} zaj.)\n{{/each}}'
                          )
                        }
                      >
                        Wstaw blok listy przedmiotów
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="flex justify-between items-center mt-4">
          <div>
            {localTemplate?.id && (
              <Button
                variant="destructive"
                className="rounded-xl"
                onClick={handleDeleteClick}
                disabled={isDeleting || isSaving}
              >
                Usuń szablon
              </Button>
            )}
          </div>
          <div className="space-x-2">
            <Button variant="outline" className="rounded-xl" onClick={onClose}>
              Anuluj
            </Button>
            <Button
              className="rounded-xl"
              onClick={handleSaveClick}
              disabled={isSaving || isDeleting}
            >
              {isSaving ? 'Zapisywanie...' : 'Zapisz'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
