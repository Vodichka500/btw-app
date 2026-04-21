import React from 'react'
import { Eye, Check, AlertTriangle } from 'lucide-react'
import { Badge } from '@/components/shared/ui/badge'
import { Checkbox } from '@/components/shared/ui/checkbox'
import { Button } from '@/components/shared/ui/button'
import { TableCell, TableRow } from '@/components/shared/ui/table'
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
