import { Loader2, AlertTriangle, MessageSquarePlus, Pencil } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/shared/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/shared/ui/table'
import { Button } from '@/components/shared/ui/button'
import { Checkbox } from '@/components/shared/ui/checkbox'
import { Progress } from '@/components/shared/ui/progress'
import { cn } from '@/lib/utils'

interface ReportsTeacherTableProps {
  teachersStats: any[] | undefined
  statsLoading: boolean
  selectedTeacherIds: number[]
  onSelectAll: () => void
  onToggleSelect: (teacherId: number) => void
  onTeacherClick: (teacherInternalId: string) => void
  onOpenTemplateEditor: () => void
  onOpenSendModal: () => void
}

export function ReportsTeacherTable({
  teachersStats,
  statsLoading,
  selectedTeacherIds,
  onSelectAll,
  onToggleSelect,
  onTeacherClick,
  onOpenTemplateEditor,
  onOpenSendModal
}: ReportsTeacherTableProps) {
  return (
    <Card className="rounded-xl border-border shadow-sm">
      <CardHeader className="flex flex-row items-start justify-between pb-4">
        <div>
          <CardTitle className="text-foreground">Postępy Nauczycieli</CardTitle>
          <CardDescription>Status raportów w wybranym cyklu rozliczeniowym</CardDescription>
        </div>

        {selectedTeacherIds.length > 0 && (
          <div className="flex items-center gap-2 animate-in zoom-in-95 duration-200">
            <Button
              variant="outline"
              onClick={onOpenTemplateEditor}
              className="rounded-xl shadow-sm border-dashed"
            >
              <Pencil className="w-4 h-4 mr-2" /> Edytuj tekst
            </Button>
            <Button
              onClick={onOpenSendModal}
              className="rounded-xl shadow-md bg-primary hover:bg-primary/90"
            >
              <MessageSquarePlus className="w-4 h-4 mr-2" />
              Wyślij przypomnienie ({selectedTeacherIds.length})
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="rounded-xl border border-border overflow-hidden">
          <Table>
            <TableHeader className="bg-secondary/50">
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="w-[50px]">
                  <Checkbox
                    checked={
                      teachersStats &&
                      teachersStats.filter((t) => t.pending > 0).length > 0 &&
                      selectedTeacherIds.length ===
                        teachersStats.filter((t) => t.pending > 0).length
                    }
                    onCheckedChange={onSelectAll}
                    title="Wybierz wszystkich z oczekującymi"
                  />
                </TableHead>
                <TableHead className="text-muted-foreground font-semibold">Nauczyciel</TableHead>
                <TableHead className="text-right text-muted-foreground font-semibold">
                  Postęp
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {statsLoading ? (
                <TableRow>
                  <TableCell colSpan={3} className="h-32 text-center">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mx-auto" />
                  </TableCell>
                </TableRow>
              ) : !teachersStats || teachersStats.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="h-32 text-center text-muted-foreground">
                    Brak przypisanych raportów.
                  </TableCell>
                </TableRow>
              ) : (
                teachersStats.map((teacher) => {
                  const completedCount = teacher.sent + teacher.canceled + teacher.failed
                  const progress = Math.round((completedCount / teacher.total) * 100) || 0
                  const isComplete = completedCount === teacher.total
                  const hasPending = teacher.pending > 0

                  return (
                    <TableRow
                      key={teacher.teacherId}
                      className={cn(
                        'border-border transition-colors',
                        selectedTeacherIds.includes(teacher.teacherId)
                          ? 'bg-primary/5'
                          : 'hover:bg-secondary/20'
                      )}
                    >
                      <TableCell>
                        <Checkbox
                          checked={selectedTeacherIds.includes(teacher.teacherId)}
                          onCheckedChange={() => onToggleSelect(teacher.teacherId)}
                          disabled={!hasPending}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span
                            className="font-medium text-foreground hover:underline cursor-pointer"
                            onClick={() => onTeacherClick(teacher.teacherInternalId.toString())}
                          >
                            {teacher.teacherName}
                          </span>
                          {!teacher.tgChatId && (
                            <span className="text-[10px] text-destructive flex items-center mt-0.5">
                              <AlertTriangle className="w-3 h-3 mr-1" /> Brak konta TG
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-3 w-full">
                          <Progress
                            value={progress}
                            className={`h-2 w-full max-w-[200px] bg-secondary ${isComplete ? '[&>div]:bg-emerald-500' : '[&>div]:bg-amber-500'}`}
                          />
                          <span className="text-sm font-medium text-muted-foreground min-w-[60px] text-right">
                            {completedCount}/{teacher.total}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
