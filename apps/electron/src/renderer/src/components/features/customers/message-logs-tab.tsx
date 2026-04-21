import { useState } from 'react'
import { trpc } from '@/lib/trpc'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/shared/ui/table'
import { Badge } from '@/components/shared/ui/badge'
import { Button } from '@/components/shared/ui/button'
import { Input } from '@/components/shared/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/shared/ui/select'
import {
  Loader2,
  ChevronLeft,
  ChevronRight,
  Inbox,
  Eye,
  Copy,
  Search,
  Filter,
  X,
  CheckCircle2,
  XCircle
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/shared/ui/dialog'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

type StatusFilter = 'all' | 'SUCCESS' | 'FAILED'

export function MessageLogsTab() {
  // Стейты, которые улетают на сервер
  const [appliedFilters, setAppliedFilters] = useState({
    page: 1,
    search: '',
    status: 'all' as StatusFilter
  })

  // Локальные стейты для инпутов
  const [localFilters, setLocalFilters] = useState({
    search: '',
    status: 'all' as StatusFilter
  })

  const { data, isLoading } = trpc.messageLog.get.useQuery({
    page: appliedFilters.page,
    limit: 50,
    search: appliedFilters.search || undefined,
    status: appliedFilters.status === 'all' ? undefined : appliedFilters.status
  })

  const [previewMessage, setPreviewMessage] = useState<{ name: string; body: string } | null>(null)

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Skopiowano tekst wiadomości')
  }

  const handleApplyFilters = () => {
    setAppliedFilters({
      ...appliedFilters,
      page: 1,
      search: localFilters.search,
      status: localFilters.status
    })
  }

  const handleResetFilters = () => {
    setLocalFilters({ search: '', status: 'all' })
    setAppliedFilters({ page: 1, search: '', status: 'all' })
  }

  return (
    <div className="space-y-4 flex flex-col h-full">
      {/* 🔥 TOOLBAR ФИЛЬТРОВ */}
      <div className="flex flex-wrap items-center gap-3 shrink-0 bg-card p-2 border rounded-2xl shadow-sm">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Szukaj po nazwisku lub ID ucznia..."
            value={localFilters.search}
            onChange={(e) => setLocalFilters({ ...localFilters, search: e.target.value })}
            onKeyDown={(e) => e.key === 'Enter' && handleApplyFilters()}
            className="pl-9 border-none bg-transparent shadow-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <Select
            value={localFilters.status}
            onValueChange={(val: StatusFilter) => setLocalFilters({ ...localFilters, status: val })}
          >
            <SelectTrigger className="w-[180px] rounded-xl bg-secondary border-none">
              <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Status wysyłki" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Wszystkie logi</SelectItem>
              <SelectItem value="SUCCESS">
                <div className="flex items-center text-success">
                  <CheckCircle2 className="w-4 h-4 mr-2" /> Dostarczono
                </div>
              </SelectItem>
              <SelectItem value="FAILED">
                <div className="flex items-center text-destructive">
                  <XCircle className="w-4 h-4 mr-2" /> Błąd
                </div>
              </SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleResetFilters}
            className="rounded-xl text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </Button>

          <Button className="rounded-xl" onClick={handleApplyFilters}>
            Szukaj
          </Button>
        </div>
      </div>

      {/* ТАБЛИЦА */}
      <div className="bg-card border rounded-2xl shadow-sm flex-1 overflow-auto custom-scrollbar">
        <Table>
          <TableHeader className="bg-muted/50 sticky top-0 z-10">
            <TableRow>
              <TableHead className="w-[180px]">Data wysłania</TableHead>
              <TableHead>Odbiorca</TableHead>
              <TableHead className="w-[300px]">Status</TableHead>
              <TableHead className="w-[80px] text-right">Akcje</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="h-32 text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : !data || data.items.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="h-32 text-center text-muted-foreground flex-col items-center justify-center"
                >
                  <Inbox className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  Brak logów dla wybranych filtrów.
                </TableCell>
              </TableRow>
            ) : (
              data.items.map((log) => (
                <TableRow
                  key={log.id}
                  className={cn(log.status === 'FAILED' && 'bg-destructive/5')}
                >
                  <TableCell className="text-muted-foreground whitespace-nowrap text-sm">
                    {new Date(log.createdAt).toLocaleString('pl-PL', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit'
                    })}
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">
                      {log.customerName || `Uczeń #${log.alfaId}`}
                    </span>
                    <span className="text-xs text-muted-foreground block mt-0.5">
                      Alfa ID: {log.alfaId}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col items-start gap-1">
                      <Badge
                        variant={log.status === 'SUCCESS' ? 'default' : 'destructive'}
                        className={
                          log.status === 'SUCCESS' ? 'bg-success text-success-foreground' : ''
                        }
                      >
                        {log.status === 'SUCCESS' ? 'Dostarczono' : 'Błąd'}
                      </Badge>
                      {log.errorReason && (
                        <span
                          className="text-[11px] text-destructive leading-tight max-w-[280px] line-clamp-2"
                          title={log.errorReason}
                        >
                          {log.errorReason}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="hover:bg-secondary"
                      onClick={() =>
                        setPreviewMessage({
                          name: log.customerName || `Uczeń #${log.alfaId}`,
                          body: log.messageBody
                        })
                      }
                    >
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* ПАГИНАЦИЯ */}
      {data?.totalPages && data.totalPages > 1 && (
        <div className="flex items-center justify-between px-6 py-4 bg-card border rounded-2xl shrink-0">
          <span className="text-sm text-muted-foreground">
            Znaleziono: <span className="font-medium text-foreground">{data.total}</span> logów
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setAppliedFilters((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))
              }
              disabled={appliedFilters.page === 1}
              className="rounded-lg"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm font-medium w-12 text-center">
              {appliedFilters.page} / {data.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setAppliedFilters((prev) => ({
                  ...prev,
                  page: Math.min(data.totalPages, prev.page + 1)
                }))
              }
              disabled={appliedFilters.page === data.totalPages}
              className="rounded-lg"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* МОДАЛКА ПРЕДПРОСМОТРА */}
      <Dialog open={!!previewMessage} onOpenChange={(open) => !open && setPreviewMessage(null)}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Wysłana wiadomość</DialogTitle>
          </DialogHeader>
          <div className="text-sm font-medium mb-1">Odbiorca: {previewMessage?.name}</div>
          <div className="bg-secondary p-4 rounded-xl text-sm text-muted-foreground whitespace-pre-wrap max-h-[50vh] overflow-y-auto">
            {previewMessage?.body}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              className="w-full rounded-xl"
              onClick={() => {
                if (previewMessage) {
                  copyToClipboard(previewMessage.body)
                  setPreviewMessage(null)
                }
              }}
            >
              <Copy className="h-4 w-4 mr-2" /> Kopiuj tekst i zamknij
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
