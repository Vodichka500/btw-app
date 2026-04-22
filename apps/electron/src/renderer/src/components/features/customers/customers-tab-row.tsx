import { memo } from 'react'
import { Button } from '@/components/shared/ui/button'
import { Input } from '@/components/shared/ui/input'
import { Checkbox } from '@/components/shared/ui/checkbox'
import { Badge } from '@/components/shared/ui/badge'
import {
  TableCell,
  TableRow
} from '@/components/shared/ui/table'
import { Pencil } from 'lucide-react'
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
      <TableRow className={cn(isSelected ? 'bg-primary/5' : 'hover:bg-muted/50')}>
        <TableCell>
          <Checkbox checked={isSelected} onCheckedChange={() => onToggleSelection(c)} />
        </TableCell>
        <TableCell className="text-muted-foreground">#{c.alfaId}</TableCell>
        <TableCell>
          <span className="font-medium">{c.name}</span>
        </TableCell>
        <TableCell className="text-muted-foreground">{c.customClass || '—'}</TableCell>
        <TableCell>
          <div className="flex flex-wrap gap-1">
            {c.teacherIds && c.teacherIds.length > 0 ? (
              c.teacherIds.map((tid: number) => {
                const teacher = teachers.find((t) => t.alfacrmId === tid || t.id === tid)
                return (
                  <Badge
                    key={tid}
                    variant="secondary"
                    className="text-[10px] font-normal px-1.5 py-0"
                  >
                    {teacher ? teacher.name : `ID: ${tid}`}
                  </Badge>
                )
              })
            ) : (
              <span className="text-muted-foreground text-xs">—</span>
            )}
          </div>
        </TableCell>
        <TableCell
          onDoubleClick={() => onDoubleClickNote(c.id, c.note || '')}
          className="max-w-[200px]"
        >
          {editingNoteId === c.id ? (
            <Input
              autoFocus
              className="h-8 text-xs rounded-md"
              value={editingNoteValue}
              onChange={(e) => onChangeNoteValue(e.target.value)}
              onBlur={() => onSaveNote(c.id, editingNoteValue!)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onSaveNote(c.id, editingNoteValue!)
                if (e.key === 'Escape') onCancelNote()
              }}
            />
          ) : (
            <div className="cursor-pointer text-xs text-muted-foreground line-clamp-2 hover:text-foreground transition-colors">
              {c.note || '—'}
            </div>
          )}
        </TableCell>
        <TableCell>
          <span
            className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${c.isSelfPaid ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}
          >
            {c.isSelfPaid ? 'Uczeń' : 'Rodzic'}
          </span>
        </TableCell>
        <TableCell className="text-sm">
          {c.studentTgChatId ? (
            <span className="text-emerald-600">✅</span>
          ) : (
            <span className="text-muted-foreground opacity-50">❌</span>
          )}
        </TableCell>
        <TableCell className="text-sm">
          {c.parentTgChatId ? (
            <span className="text-emerald-600">✅</span>
          ) : (
            <span className="text-muted-foreground opacity-50">❌</span>
          )}
        </TableCell>
        <TableCell className="text-right">
          <Button variant="ghost" size="icon" onClick={() => onEditCustomer(c)}>
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

    // Если ничего из вышеперечисленного не изменилось — НЕ РЕНДЕРИМ СТРОКУ!
    return true
  }
)
CustomerTableRow.displayName = 'CustomerTableRow'
