import React from 'react'
import { Eye, Check, AlertTriangle } from 'lucide-react'
import { Badge } from '@/components/shared/ui/badge'
import { Checkbox } from '@/components/shared/ui/checkbox'
import { Button } from '@/components/shared/ui/button'
import { TableCell, TableRow } from '@/components/shared/ui/table'
// 🔥 Добавляем импорты для всплывашки
import { Popover, PopoverContent, PopoverTrigger } from '@/components/shared/ui/popover'
import { type UIBillingItem } from '@btw-app/shared'

const formatPLN = (amount: number) =>
  amount.toLocaleString('pl-PL', { style: 'currency', currency: 'PLN' })

interface StudentRowProps {
  student: UIBillingItem
  isSelected: boolean
  isSent: boolean
  onToggle: (id: number) => void
  onPreview: (student: UIBillingItem) => void
}

export const PendingPaymentsRow = React.memo(
  ({ student, isSelected, isSent, onToggle, onPreview }: StudentRowProps) => {
    const hasTg =
      (student.isSelfPaid && !!student.studentTgChatId) ||
      (!student.isSelfPaid && !!student.parentTgChatId)

    return (
      <TableRow className={isSelected ? 'bg-primary/5' : 'hover:bg-muted/50 transition-colors'}>
        <TableCell>
          <Checkbox checked={isSelected} onCheckedChange={() => onToggle(student.alfaId)} />
        </TableCell>
        <TableCell>
          {isSent ? (
            <Badge
              variant="default"
              className="bg-success text-success-foreground hover:bg-success/90 rounded-md"
            >
              Wysłano
            </Badge>
          ) : (
            <Badge variant="secondary" className="rounded-md">
              Oczekuje
            </Badge>
          )}
        </TableCell>
        <TableCell className="font-semibold">{student.name}</TableCell>

        <TableCell>
          {student.note ? (
            <Popover>
              <PopoverTrigger asChild>
                <div
                  className="max-w-[120px] truncate cursor-pointer border-b border-dashed border-transparent hover:border-muted-foreground text-sm text-muted-foreground hover:text-foreground transition-all"
                  title="Kliknij, aby zobaczyć notatkę"
                >
                  {student.note}
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-4 rounded-xl shadow-lg z-50">
                <h4 className="font-semibold text-sm mb-2">Notatka</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words w-full">
                  {student.note}
                </p>
              </PopoverContent>
            </Popover>
          ) : (
            <span className="text-muted-foreground opacity-50">—</span>
          )}
        </TableCell>
        <TableCell>
          <span
            className={
              student.remainderAtStart < 0
                ? 'text-destructive font-medium'
                : 'text-success font-medium'
            }
          >
            {formatPLN(student.remainderAtStart)}
          </span>
        </TableCell>
        <TableCell className="text-muted-foreground">
          {formatPLN(student.targetMonthCost)}
        </TableCell>
        <TableCell>
          <span className="text-lg font-bold">{formatPLN(student.totalToPay)}</span>
        </TableCell>
        <TableCell>
          <div className="flex flex-wrap gap-1">
            {student.subjects.map((subj) => (
              <Badge
                key={subj.id}
                variant="secondary"
                className="text-xs font-normal bg-secondary/50"
              >
                {subj.name} ({subj.quantity})
              </Badge>
            ))}
          </div>
        </TableCell>
        <TableCell>
          {hasTg ? (
            <div className="flex items-center gap-1.5 text-success">
              <Check className="h-4 w-4" /> Jest
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-warning">
              <AlertTriangle className="h-4 w-4" /> Brak ID
            </div>
          )}
        </TableCell>
        <TableCell>
          <Button
            variant="ghost"
            size="icon"
            className="hover:bg-secondary"
            onClick={() => onPreview(student)}
          >
            <Eye className="h-4 w-4 text-muted-foreground" />
          </Button>
        </TableCell>
      </TableRow>
    )
  }
)

PendingPaymentsRow.displayName = 'PendingPaymentsRow'
