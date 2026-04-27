import React from 'react'
import { Eye, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { Badge } from '@/components/shared/ui/badge'
import { Checkbox } from '@/components/shared/ui/checkbox'
import { Button } from '@/components/shared/ui/button'
import { TableCell, TableRow } from '@/components/shared/ui/table'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/shared/ui/popover'
import { type UIBillingItem } from '@btw-app/shared'
import { cn } from '@/lib/utils'

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

    // Определяем цвет для "Stan na pierwszy dzień"
    let remainderColor = 'text-primary' // 0 -> сиреневый (наш soft periwinkle)
    if (student.remainderAtStart < 0) {
      remainderColor = 'text-destructive' // < 0 -> красный (наш soft coral)
    } else if (student.remainderAtStart > 0) {
      remainderColor = 'text-success' // > 0 -> зеленый (наш soft mint)
    }

    return (
      <TableRow
        className={cn(
          'border-b-border/50',
          isSelected ? 'bg-primary/10' : 'hover:bg-secondary/50 transition-colors'
        )}
      >
        <TableCell className="p-2">
          <Checkbox
            className="rounded-md"
            checked={isSelected}
            onCheckedChange={() => onToggle(student.alfaId)}
          />
        </TableCell>
        <TableCell>
          {isSent ? (
            <Badge className="rounded-md font-semibold bg-primary/10 text-primary">Wysłano</Badge>
          ) : (
            <Badge
              variant="secondary"
              className="rounded-md font-semibold bg-secondary text-muted-foreground"
            >
              Oczekuje
            </Badge>
          )}
        </TableCell>
        <TableCell className="font-semibold text-foreground">{student.name}</TableCell>

        <TableCell>
          {student.note ? (
            <Popover>
              <PopoverTrigger asChild>
                <div
                  className="max-w-[120px] truncate cursor-pointer text-sm text-muted-foreground hover:text-foreground transition-all"
                  title="Kliknij, aby zobaczyć notatkę"
                >
                  {student.note}
                </div>
              </PopoverTrigger>
              <PopoverContent
                className="w-80 p-4 rounded-xl shadow-lg z-50 bg-card border-border/50"
                align="start"
              >
                <h4 className="font-semibold text-sm mb-2 text-foreground">Notatka</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words w-full">
                  {student.note}
                </p>
              </PopoverContent>
            </Popover>
          ) : (
            <span className="text-muted-foreground/60">—</span>
          )}
        </TableCell>
        <TableCell>
          <span className={cn('font-semibold', remainderColor)}>
            {formatPLN(student.remainderAtStart)}
          </span>
        </TableCell>
        <TableCell className="text-muted-foreground font-medium">
          {formatPLN(student.targetMonthCost)}
        </TableCell>
        <TableCell>
          <span className="text-lg font-bold text-foreground tracking-tight">
            {formatPLN(student.totalToPay)}
          </span>
        </TableCell>
        <TableCell>
          <div className="flex flex-wrap gap-1">
            {student.subjects.map((subj) => (
              <Badge
                key={subj.id}
                variant="secondary"
                className="font-medium bg-secondary/50 text-muted-foreground"
              >
                {subj.name} ({subj.quantity})
              </Badge>
            ))}
          </div>
        </TableCell>
        <TableCell>
          {hasTg ? (
            <div className="flex items-center gap-1.5 text-success font-semibold">
              <CheckCircle2 className="h-4 w-4" /> Jest
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-destructive font-semibold">
              <AlertTriangle className="h-4 w-4" /> Brak
            </div>
          )}
        </TableCell>
        <TableCell>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-xl hover:bg-secondary"
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
