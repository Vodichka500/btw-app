'use client'

import { useRef } from 'react'
import { Database } from 'lucide-react'
import { Label } from '@/components/shared/ui/label'
import { Textarea } from '@/components/shared/ui/textarea'
import { Button } from '@/components/shared/ui/button'
import { ReminderTagSchema, type ReminderTag } from '@btw-app/shared'

const TAG_LABELS: Record<ReminderTag, string> = {
  '{TEACHER_NAME}': 'Imię nauczyciela',
  '{CYCLE_NAME}': 'Nazwa cyklu',
  '{PERIOD_START}': 'Początek okresu',
  '{PERIOD_END}': 'Koniec okresu',
  '{PENDING_COUNT}': 'Pozostało raportów',
  '{TOTAL_COUNT}': 'Wszystkie raporty',
  '{DEADLINE}': 'Termin (Deadline)'
}

const REMINDER_TAGS = ReminderTagSchema.options.map((tag) => ({
  tag,
  name: TAG_LABELS[tag as ReminderTag]
}))

interface ReminderTemplateEditorProps {
  value: string
  onChange: (val: string) => void
  renderPreview: () => string
}

export function ReminderTemplateEditor({
  value,
  onChange,
  renderPreview
}: ReminderTemplateEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const insertTag = (tag: string) => {
    const textarea = textareaRef.current
    if (textarea) {
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const newValue = value.slice(0, start) + tag + value.slice(end)
      onChange(newValue)

      // Возвращаем фокус и курсор после вставки
      setTimeout(() => {
        textarea.focus()
        textarea.setSelectionRange(start + tag.length, start + tag.length)
      }, 0)
    } else {
      onChange(value + tag)
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Left: Tags */}
      <div className="lg:col-span-1 flex flex-col gap-3">
        <h4 className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-1.5">
          <Database className="h-3 w-3" /> Zmienne do użycia
        </h4>
        <div className="flex flex-col gap-1.5">
          {REMINDER_TAGS.map((sys) => (
            <Button
              key={sys.tag}
              variant="secondary"
              size="sm"
              onClick={() => insertTag(sys.tag)}
              className="w-full justify-start rounded-lg text-xs font-medium bg-primary/5 text-primary hover:bg-primary/15 border border-primary/10"
            >
              <span className="truncate">{sys.name}</span>
              <span className="ml-auto font-mono opacity-70">{sys.tag}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Right: Editor & Preview */}
      <div className="lg:col-span-2 flex flex-col gap-4">

        <div className="space-y-2 flex flex-col">
          <Label>Treść wiadomości</Label>
          <Textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            // 🔥 Заменили resize-y на resize-none, ограничили высоту max-h-60
            className="max-h-60 overflow-y-auto w-full break-words whitespace-pre-wrap min-h-[150px] font-sans text-sm leading-relaxed rounded-xl resize-none custom-scrollbar p-4"
            placeholder="Wpisz treść przypomnienia..."
          />
        </div>

        {/* Preview */}
        {/* 🔥 Убрали max-h-[40%], поставили жесткий max-h-60, сделали flex flex-col */}
        <div className="rounded-xl border border-border bg-secondary/30 p-4 flex flex-col max-h-60">
          <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-3 shrink-0">
            Podgląd na żywo
          </h4>
          {/* 🔥 Перенесли скролл и стили карточки сюда. Теперь заголовок стоит на месте, а текст скроллится! */}
          <div className="overflow-y-auto custom-scrollbar bg-background rounded-xl border border-border p-4">
            <div className="whitespace-pre-wrap break-words text-sm text-foreground">
              {renderPreview()}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
