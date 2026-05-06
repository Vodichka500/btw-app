import { memo } from 'react'
import { Button } from '@/components/shared/ui/button'
import { Input } from '@/components/shared/ui/input'
import { Checkbox } from '@/components/shared/ui/checkbox'
import { Badge } from '@/components/shared/ui/badge'
import {
  TableCell,
  TableRow
} from '@/components/shared/ui/table'
import { Pencil, CheckCircle2, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Customer } from '@btw-app/shared'
import { Teacher } from '@/lib/trpc'

interface CustomersTabRowProps {
  customer: Customer
  isSelected: boolean
  teachers: Teacher[]
  editingNoteId: number | undefined
  editingNoteValue: string | undefined
  onToggleSelection: (customer: Customer) => void
  onDoubleClickNote: (customerId: number, currentNote: string) => void
  onChangeNoteValue: (value: string) => void
  onSaveNote: (customerId: number, newNote: string) => void
  onCancelNote: () => void
  onEditCustomer: (customer: Customer) => void
}

export const CustomerTableRow = memo(
  ({
    customer: c,
    isSelected,
    teachers,
    editingNoteId,
    editingNoteValue,
    onToggleSelection,
    onDoubleClickNote,
    onChangeNoteValue,
    onSaveNote,
    onCancelNote,
    onEditCustomer
  }: CustomersTabRowProps) => {
    return (
      <TableRow
        className={cn(
          'border-b-border/50',
          isSelected ? 'bg-primary/10' : 'hover:bg-secondary/50'
        )}
      >
        <TableCell className="p-2">
          <Checkbox
            className="rounded-md"
            checked={isSelected}
            onCheckedChange={() => onToggleSelection(c)}
          />
        </TableCell>
        <TableCell className="text-muted-foreground font-medium">#{c.alfaId}</TableCell>
        <TableCell>
          <span className="font-semibold text-foreground">{c.name}</span>
        </TableCell>
        <TableCell className="text-muted-foreground font-medium">{c.customClass || '—'}</TableCell>
        <TableCell>
          <div className="flex flex-wrap gap-1">
            {c.teacherIds && c.teacherIds.length > 0 ? (
              c.teacherIds.map((tid: number) => {
                const teacher = teachers.find((t) => t.alfacrmId === tid || t.id === tid)
                return (
                  <Badge
                    key={tid}
                    variant="secondary"
                    className="font-medium bg-secondary/50 text-muted-foreground"
                  >
                    {teacher ? teacher.name : `ID: ${tid}`}
                  </Badge>
                )
              })
            ) : (
              <span className="text-muted-foreground text-sm">—</span>
            )}
          </div>
        </TableCell>
        <TableCell
          onDoubleClick={() => onDoubleClickNote(c.id, c.note || '')}
          className="max-w-[250px] group"
        >
          {editingNoteId === c.id ? (
            <Input
              autoFocus
              className="h-8 text-sm rounded-lg bg-secondary/50 border-none focus-visible:ring-2 focus-visible:ring-primary/50"
              value={editingNoteValue}
              onChange={(e) => onChangeNoteValue(e.target.value)}
              onBlur={() => onSaveNote(c.id, editingNoteValue!)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onSaveNote(c.id, editingNoteValue!)
                if (e.key === 'Escape') onCancelNote()
              }}
            />
          ) : (
            <div className="cursor-pointer text-sm text-muted-foreground line-clamp-2 group-hover:text-foreground transition-colors relative pr-4">
              {c.note || <span className="opacity-60">—</span>}
              <Pencil className="w-3 h-3 absolute top-1 right-0 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          )}
        </TableCell>
        <TableCell>
          <Badge
            className={cn(
              'font-semibold',
              c.isSelfPaid
                ? 'bg-primary/10 text-primary'
                : 'bg-accent/10 text-accent'
            )}
          >
            {c.isSelfPaid ? 'Uczeń' : 'Rodzic'}
          </Badge>
        </TableCell>
        <TableCell>
          {c.studentTgChatId ? (
            <CheckCircle2 className="w-5 h-5 text-primary" />
          ) : (
            <XCircle className="w-5 h-5 text-muted-foreground/30" />
          )}
        </TableCell>
        <TableCell>
          {c.parentTgChatId ? (
            <CheckCircle2 className="w-5 h-5 text-primary" />
          ) : (
            <XCircle className="w-5 h-5 text-muted-foreground/30" />
          )}
        </TableCell>
        <TableCell className="text-right">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-xl"
            onClick={() => onEditCustomer(c)}
          >
            <Pencil className="h-4 w-4 text-muted-foreground" />
          </Button>
        </TableCell>
      </TableRow>
    )
  },
  (prevProps, nextProps) => {
    // КАСТОМНАЯ ЛОГИКА СРАВНЕНИЯ (Возвращаем true, если строка НЕ ДОЛЖНА перерендериваться)

    // 1. Изменился ли статус выбора именно ЭТОЙ строки?
    if (prevProps.isSelected !== nextProps.isSelected) return false

    // 2. Является ли эта строка той самой, в которой сейчас редактируют заметку?
    const wasEditing = prevProps.editingNoteId === prevProps.customer.id
    const isEditingNow = nextProps.editingNoteId === nextProps.customer.id

    if (wasEditing !== isEditingNow) return false // Начали или закончили редактировать тут

    // 3. Если мы ПРЯМО СЕЙЧАС редактируем эту строку, и значение инпута изменилось
    if (isEditingNow && prevProps.editingNoteValue !== nextProps.editingNoteValue) return false

    // 4. Изменились ли сами данные ученика? (Сравниваем по ID и updatedAt/note, если есть)
    // В идеале бэкенд возвращает updatedAt, но если нет, проверяем критичные поля.
    // Так как data.items может пересоздаваться, сравнение по ссылке prevProps.customer === nextProps.customer часто врет.
    if (prevProps.customer.alfaId !== nextProps.customer.alfaId) return false
    if (prevProps.customer.note !== nextProps.customer.note) return false
    if (prevProps.customer.customClass !== nextProps.customer.customClass) return false
    if (prevProps.customer.isSelfPaid !== nextProps.customer.isSelfPaid) return false
    if (prevProps.customer.studentTgChatId !== nextProps.customer.studentTgChatId) return false
    if (prevProps.customer.parentTgChatId !== nextProps.customer.parentTgChatId) return false

    // Если ничего из вышеперечисленного не изменилось — НЕ РЕНДЕРИМ СТРОКУ!
    return true
  }
)
CustomerTableRow.displayName = 'CustomerTableRow'
