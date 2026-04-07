'use client'

import { useState, useEffect } from 'react'
import { Inbox, Calendar, User, Loader2, ChevronLeft, ChevronRight, Eye, Copy, AlertCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/shared/ui/card'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/shared/ui/table'
import { Badge } from '@/components/shared/ui/badge'
import { Button } from '@/components/shared/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/shared/ui/popover'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/shared/ui/dialog'
import { cn } from '@/lib/utils'
import { trpc } from '@/lib/trpc'
import { toast } from 'sonner'

const MONTHS_PL = ['Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec', 'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień']
const MONTHS_SHORT = ['Sty', 'Lut', 'Mar', 'Kwi', 'Maj', 'Cze', 'Lip', 'Sie', 'Wrz', 'Paź', 'Lis', 'Gru']

export function SentHistoryTab() {
  const today = new Date()
  const [selectedMonth, setSelectedMonth] = useState(`${today.getMonth()}-${today.getFullYear()}`)

  const [mStr, yStr] = selectedMonth.split('-')
  const monthNum = parseInt(mStr, 10)
  const yearNum = parseInt(yStr, 10)

  const { data: logs, isLoading } = trpc.billingLog.get.useQuery({
    month: monthNum,
    year: yearNum
  })

  const [viewYear, setViewYear] = useState(yearNum)
  const [isOpen, setIsOpen] = useState(false)

  // 🔥 Стейт для глобальной модалки предпросмотра сообщения
  const [previewMessage, setPreviewMessage] = useState<{ name: string; body: string } | null>(null)

  useEffect(() => {
    if (isOpen) setViewYear(yearNum)
  }, [isOpen, yearNum])

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Skopiowano tekst wiadomości')
  }

  return (
    <div className="space-y-4 flex flex-col h-full">
      {/* FILTER BAR */}
      <div className="flex items-center justify-between shrink-0">
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="min-w-[180px] justify-start text-left font-medium rounded-xl bg-secondary border-border hover:bg-secondary/80">
              <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
              <span>{MONTHS_PL[monthNum]} {yearNum}</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-3 rounded-2xl border-border bg-card shadow-lg" align="start">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-border">
              <Button variant="ghost" size="icon" onClick={() => setViewYear((v) => v - 1)} className="h-8 w-8 rounded-lg"><ChevronLeft className="h-4 w-4" /></Button>
              <span className="text-sm font-bold">{viewYear}</span>
              <Button variant="ghost" size="icon" onClick={() => setViewYear((v) => v + 1)} className="h-8 w-8 rounded-lg"><ChevronRight className="h-4 w-4" /></Button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {MONTHS_SHORT.map((m, i) => (
                <Button
                  key={m} variant="ghost"
                  onClick={() => { setSelectedMonth(`${i}-${viewYear}`); setIsOpen(false) }}
                  className={cn('h-10 text-xs font-medium rounded-xl', i === monthNum && viewYear === yearNum ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary')}
                >{m}</Button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        <div className="text-sm text-muted-foreground">
          Znaleziono: <span className="font-medium text-foreground">{logs?.length || 0}</span> logów
        </div>
      </div>

      {/* ТАБЛИЦА */}
      {isLoading ? (
        <Card className="bg-card border-border h-full flex items-center justify-center rounded-2xl">
          <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin mb-4" />
            <p className="text-sm">Ładowanie historii...</p>
          </CardContent>
        </Card>
      ) : !logs || logs.length === 0 ? (
        <Card className="bg-card border-border h-full flex items-center justify-center rounded-2xl">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted"><Inbox className="h-8 w-8 text-muted-foreground" /></div>
            <h3 className="mt-4 text-lg font-medium text-foreground">Historia jest pusta</h3>
            <p className="mt-2 text-sm text-muted-foreground max-w-sm text-center">
              Nie znaleziono logów dla wybranego miesiąca ({(monthNum + 1).toString().padStart(2, '0')}.{yearNum}).
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-xl border bg-card flex-1 overflow-auto custom-scrollbar">
          <Table>
            <TableHeader className="sticky top-0 bg-card z-10 shadow-sm">
              <TableRow>
                <TableHead>Data wysłania</TableHead>
                <TableHead>Uczeń</TableHead>
                <TableHead>Kwota (PLN)</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id} className="hover:bg-secondary/50">
                  <TableCell className="text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {new Date(log.sentAt).toLocaleString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </TableCell>

                  {/* 🔥 Умная колонка с именем ученика */}
                  <TableCell>
                    {log.customerName ? (
                      <div className="flex flex-col">
                        <span className="font-semibold text-foreground">{log.customerName}</span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><User className="w-3 h-3" /> ID: {log.alfaId}</span>
                      </div>
                    ) : (
                      <div className="flex flex-col">
                        <span className="font-semibold text-muted-foreground">#{log.alfaId}</span>
                        <span className="text-xs text-destructive flex items-center gap-1 mt-0.5"><AlertCircle className="w-3 h-3" /> Brak w bazie</span>
                      </div>
                    )}
                  </TableCell>

                  <TableCell className="font-bold">
                    {log.amountCalculated.toLocaleString('pl-PL', { style: 'currency', currency: 'PLN' })}
                  </TableCell>

                  <TableCell>
                    <Badge variant={log.status === 'SUCCESS' ? 'default' : 'destructive'} className={log.status === 'SUCCESS' ? 'bg-success text-success-foreground' : ''}>
                      {log.status === 'SUCCESS' ? 'Dostarczono' : 'Błąd'}
                    </Badge>
                  </TableCell>

                  {/* 🔥 Кнопка предпросмотра */}
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="hover:bg-secondary"
                      onClick={() => setPreviewMessage({ name: log.customerName || `Uczeń #${log.alfaId}`, body: log.messageBody })}
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

      {/* 🔥 Глобальная модалка для просмотра сообщения */}
      <Dialog open={!!previewMessage} onOpenChange={(open) => !open && setPreviewMessage(null)}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Wysłana wiadomość - {previewMessage?.name}</DialogTitle>
          </DialogHeader>
          <div className="bg-secondary p-4 rounded-xl text-sm text-muted-foreground whitespace-pre-wrap font-sans max-h-[60vh] overflow-y-auto">
            {previewMessage?.body}
          </div>
          <DialogFooter>
            <Button variant="outline" className="w-full rounded-xl" onClick={() => previewMessage && copyToClipboard(previewMessage.body)}>
              <Copy className="h-4 w-4 mr-2" /> Kopiuj tekst
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
