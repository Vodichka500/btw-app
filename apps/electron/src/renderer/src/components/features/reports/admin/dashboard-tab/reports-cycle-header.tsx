import { RefreshCw, Trash2, AlertTriangle, Loader2 } from 'lucide-react'
import { Label } from '@/components/shared/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/shared/ui/select'
import { Button } from '@/components/shared/ui/button'
import { Badge } from '@/components/shared/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/shared/ui/alert-dialog'

const formatDate = (d: string | Date) => {
  return new Date(d).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' })
}

interface ReportsCycleHeaderProps {
  cycles: any[]
  actualCycleId: string
  activeCycle: any
  onCycleChange: (id: string) => void
  onRefresh: () => void
  onDelete: () => void
  isRefreshing: boolean
  isDeleting: boolean
  isStatsFetching: boolean
  hasMissingData: boolean | null | undefined
}

export function ReportsCycleHeader({
  cycles,
  actualCycleId,
  activeCycle,
  onCycleChange,
  onRefresh,
  onDelete,
  isRefreshing,
  isDeleting,
  isStatsFetching,
  hasMissingData
}: ReportsCycleHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end gap-4 justify-between bg-card p-4 rounded-xl border border-border shadow-sm">
      <div className="w-full max-w-sm">
        <Label htmlFor="cycle" className="text-sm font-semibold mb-2 block text-foreground">
          Cykl raportowania
        </Label>
        <Select value={actualCycleId} onValueChange={onCycleChange}>
          <SelectTrigger
            id="cycle"
            className="h-auto py-3 rounded-xl border-border/60 bg-background"
          >
            <SelectValue placeholder="Wybierz cykl" />
          </SelectTrigger>
          <SelectContent>
            {cycles.map((cycle) => (
              <SelectItem key={cycle.id} value={cycle.id.toString()}>
                <div className="flex flex-col text-left py-0.5">
                  {cycle.label && (
                    <span className="text-xs font-bold text-primary mb-0.5">{cycle.label}</span>
                  )}
                  <div className="flex items-center gap-2 text-sm">
                    {formatDate(cycle.periodStart)} - {formatDate(cycle.periodEnd)}
                    {!cycle.isArchived && (
                      <Badge
                        variant="secondary"
                        className="text-[10px] ml-2 bg-primary/10 text-primary"
                      >
                        Aktualny
                      </Badge>
                    )}
                  </div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          onClick={onRefresh}
          disabled={isRefreshing || isStatsFetching || isDeleting}
          className="rounded-xl border-primary/20 text-primary hover:bg-primary/10"
        >
          {isRefreshing ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}{' '}
          Zaktualizuj cykl
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              disabled={isRefreshing || isDeleting}
              className="rounded-xl border-destructive/30 text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="rounded-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle>Usunąć wybrany cykl?</AlertDialogTitle>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="rounded-xl">Anuluj</AlertDialogCancel>
              <AlertDialogAction
                className="rounded-xl bg-destructive hover:bg-destructive/90 text-white"
                onClick={onDelete}
              >
                Usuń bezpowrotnie
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {hasMissingData && (
          <div className="flex items-start gap-3 rounded-xl border border-warning/30 bg-warning/10 p-4 text-warning-foreground animate-in fade-in">
            <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5 text-warning" />
            <div className="flex flex-col gap-1 text-sm">
              <span className="font-bold text-warning">Uwaga dotycząca synchronizacji</span>
              <span>
                Pominięto niektórych uczestników (brak w bazie):
                {activeCycle.missingCustomers.length > 0 && (
                  <strong className="ml-1">
                    {activeCycle.missingCustomers.length} uczniów (ID:{' '}
                    {activeCycle.missingCustomers.join(', ')})
                  </strong>
                )}
                {activeCycle.missingCustomers.length > 0 &&
                  activeCycle.missingTeachers.length > 0 &&
                  ' oraz '}
                {activeCycle.missingTeachers.length > 0 && (
                  <strong>
                    {activeCycle.missingTeachers.length} nauczycieli (ID:{' '}
                    {activeCycle.missingTeachers.join(', ')})
                  </strong>
                )}
                .
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
