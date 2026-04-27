import { useState } from 'react'
import { Inbox, Calendar, User, Loader2, Eye, Copy, AlertCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/shared/ui/card'
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/shared/ui/dialog'
import { trpc } from '@/lib/trpc'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const MONTHS_PL = [
  'Styczeń',
  'Luty',
  'Marzec',
  'Kwiecień',
  'Maj',
  'Czerwiec',
  'Lipiec',
  'Sierpień',
  'Wrzesień',
  'Październik',
  'Listopad',
  'Grudzień'
]

interface SentHistoryTabProps {
  monthNum: number
  yearNum: number
}

export function SentHistoryTab({ monthNum, yearNum }: SentHistoryTabProps) {
  // Context & Stores (Not present in this component)

  // Local State
  const [previewMessage, setPreviewMessage] = useState<{ name: string; body: string } | null>(null)

  // API Queries
  const { data: logs, isLoading } = trpc.billingLog.get.useQuery({
    month: monthNum,
    year: yearNum
  })

  // Handlers & Callbacks
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Skopiowano tekst wiadomości')
  }

  // Main Return
  return (
    <div className="space-y-4 flex flex-col h-full">
      {/* FILTER BAR */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center text-sm font-semibold text-foreground bg-secondary/30 px-4 py-2 rounded-xl border border-border/50">
          <Calendar className="mr-2 h-4 w-4 text-primary" />
          {MONTHS_PL[monthNum]} {yearNum}
        </div>

        <div className="text-sm text-muted-foreground font-medium">
          Znaleziono: <span className="font-semibold text-foreground">{logs?.length || 0}</span>{' '}
          logów
        </div>
      </div>

      {/* ТАБЛИЦА */}
      {isLoading ? (
        <Card className="bg-card border-border/50 h-full flex items-center justify-center rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin mb-4 text-primary" />
            <p className="font-medium">Ładowanie historii...</p>
          </CardContent>
        </Card>
      ) : !logs || logs.length === 0 ? (
        <Card className="bg-card border-border/50 h-full flex items-center justify-center rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/5">
              <Inbox className="h-10 w-10 text-primary" />
            </div>
            <h3 className="mt-6 text-lg font-bold tracking-tight text-foreground">
              Historia jest pusta
            </h3>
            <p className="mt-2 text-sm text-muted-foreground max-w-sm text-center font-medium">
              Nie znaleziono logów dla wybranego miesiąca (
              {(monthNum + 1).toString().padStart(2, '0')}.{yearNum}).
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-2xl border border-border/50 bg-card flex-1 overflow-auto custom-scrollbar shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <Table>
            <TableHeader className="sticky top-0 bg-secondary/30 z-10">
              <TableRow className="border-b-border/50">
                <TableHead className="font-semibold text-foreground">Data wysłania</TableHead>
                <TableHead className="font-semibold text-foreground">Uczeń</TableHead>
                <TableHead className="font-semibold text-foreground">Kwota (PLN)</TableHead>
                <TableHead className="font-semibold text-foreground">Status</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id} className="hover:bg-secondary/50 border-b-border/50">
                  <TableCell className="text-muted-foreground font-medium">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-primary/80" />
                      {new Date(log.sentAt).toLocaleString('pl-PL', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </TableCell>

                  <TableCell>
                    {log.customerName ? (
                      <div className="flex flex-col">
                        <span className="font-semibold text-foreground">{log.customerName}</span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5 font-medium">
                          <User className="w-3 h-3" /> ID: {log.alfaId}
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-col">
                        <span className="font-semibold text-muted-foreground">#{log.alfaId}</span>
                        <span className="text-xs text-accent flex items-center gap-1.5 mt-0.5 font-semibold">
                          <AlertCircle className="w-3 h-3" /> Brak w bazie
                        </span>
                      </div>
                    )}
                  </TableCell>

                  <TableCell className="font-bold text-foreground tracking-tight">
                    {log.amountCalculated.toLocaleString('pl-PL', {
                      style: 'currency',
                      currency: 'PLN'
                    })}
                  </TableCell>

                  <TableCell>
                    <Badge
                      variant={log.status === 'SUCCESS' ? 'default' : 'destructive'}
                      className={cn(
                        'font-semibold',
                        log.status === 'SUCCESS'
                          ? 'bg-primary/10 text-primary'
                          : 'bg-accent/10 text-accent'
                      )}
                    >
                      {log.status === 'SUCCESS' ? 'Dostarczono' : 'Błąd'}
                    </Badge>
                  </TableCell>

                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-xl hover:bg-secondary"
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
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={!!previewMessage} onOpenChange={(open) => !open && setPreviewMessage(null)}>
        <DialogContent className="sm:max-w-md rounded-2xl bg-card border-border/50">
          <DialogHeader>
            <DialogTitle className="text-foreground tracking-tight">
              Wysłana wiadomość - {previewMessage?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="bg-secondary/50 p-4 rounded-xl text-sm text-muted-foreground whitespace-pre-wrap font-sans max-h-[60vh] overflow-y-auto custom-scrollbar">
            {previewMessage?.body}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              className="w-full rounded-xl"
              onClick={() => previewMessage && copyToClipboard(previewMessage.body)}
            >
              <Copy className="h-4 w-4 mr-2" /> Kopiuj tekst
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
