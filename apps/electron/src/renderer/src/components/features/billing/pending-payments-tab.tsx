// src/components/features/billing/pending-payments-tab.tsx

'use client'

import { useState, useCallback, useMemo } from 'react'
import { Search, Send, Copy } from 'lucide-react'
import { Input } from '@/components/shared/ui/input'
import { Badge } from '@/components/shared/ui/badge'
import { Checkbox } from '@/components/shared/ui/checkbox'
import { Button } from '@/components/shared/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/shared/ui/dialog'
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/shared/ui/table'
import { toast } from 'sonner'
import { trpc } from '@/lib/trpc'
import { type UIBillingItem } from '@btw-app/shared'

import { SendMessagesModal } from '../telegram/send-messages-modal'
import { PendingPaymentsRow } from './pending-payments-row' // 🔥 Импорт нашей новой строки

interface PendingPaymentsTabProps {
  students: UIBillingItem[]
  monthNum: number
  yearNum: number
}

export function PendingPaymentsTab({ students, monthNum, yearNum }: PendingPaymentsTabProps) {
  // UI State
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilters, setActiveFilters] = useState<string[]>([])
  const [selectedIds, setSelectedIds] = useState<number[]>([])

  // Локальный кэш отправленных в этой сессии, чтобы сразу красить бейджик без рефетча
  const [locallySentIds, setLocallySentIds] = useState<number[]>([])

  // Modal States
  const [isSendModalOpen, setIsSendModalOpen] = useState(false)
  const [previewStudent, setPreviewStudent] = useState<UIBillingItem | null>(null)

  // tRPC Mutation
  const sendMutation = trpc.billing.sendSingleBilling.useMutation()

  // ---------------------------------------------------------
  // ФИЛЬТРАЦИЯ
  // ---------------------------------------------------------
  const toggleFilter = (f: string) =>
    setActiveFilters((prev) => (prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]))

  const filtered = useMemo(() => {
    return students.filter((s) => {
      const isSent = s.isSent || locallySentIds.includes(s.alfaId)
      const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase())
      const hasTg = (s.isSelfPaid && !!s.studentTgChatId) || (!s.isSelfPaid && !!s.parentTgChatId)

      const matchesFilters =
        activeFilters.length === 0 ||
        (activeFilters.includes('has-remainder') && s.currentBalance > 0) ||
        (activeFilters.includes('has-debt') && s.currentBalance < 0) ||
        (activeFilters.includes('missing-tg') && !hasTg) ||
        (activeFilters.includes('sent') && isSent) ||
        (activeFilters.includes('not-sent') && !isSent)

      return matchesSearch && matchesFilters
    })
  }, [students, searchQuery, activeFilters, locallySentIds])

  // ---------------------------------------------------------
  // ОБРАБОТЧИКИ ТАБЛИЦЫ
  // ---------------------------------------------------------
  const handleToggle = useCallback((id: number) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }, [])

  const handleSelectAll = () => {
    setSelectedIds(selectedIds.length === filtered.length ? [] : filtered.map((s) => s.alfaId))
  }

  const handlePreview = useCallback((student: UIBillingItem) => {
    setPreviewStudent(student)
  }, [])

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Skopiowano tekst wiadomości')
  }

  // ---------------------------------------------------------
  // ЛОГИКА РАССЫЛКИ (Связь с тупой модалкой)
  // ---------------------------------------------------------

  // 1. Собираем данные для модалки, подмешивая локальный статус "isSent"
  const selectedStudentsData: UIBillingItem[] = students
    .filter((s) => selectedIds.includes(s.alfaId))
    .map((s) => ({
      ...s,
      isSent: s.isSent || locallySentIds.includes(s.alfaId)
    }))

  // 2. Функция обработки одного элемента, которую будет крутить модалка
  const handleProcessItem = async (student: UIBillingItem) => {
    await sendMutation.mutateAsync({
      month: monthNum,
      year: yearNum,
      message: {
        alfaId: student.alfaId,
        name: student.name,
        amountCalculated: student.totalToPay,
        messageBody: student.generatedMessage,
        isSelfPaid: student.isSelfPaid,
        studentTgChatId: student.studentTgChatId,
        parentTgChatId: student.parentTgChatId
      }
    })
    // Если mutateAsync падает с ошибкой, модалка сама её поймает и запишет в UI лог
  }

  // 3. Коллбэк после закрытия модалки
  const handleSendComplete = (newlySentIds: number[]) => {
    if (newlySentIds.length > 0) {
      setLocallySentIds((prev) => [...prev, ...newlySentIds])
    }
    setSelectedIds([]) // Сбрасываем выбор после успешной рассылки
  }

  return (
    <div className="space-y-4 flex flex-col h-full">
      {/* FILTER BAR & ACTIONS */}
      <div className="flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Szukaj ucznia..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-[280px] bg-secondary pl-10 rounded-xl"
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {[
              { id: 'not-sent', label: 'Nie wysłano' },
              { id: 'sent', label: 'Wysłano' },
              { id: 'has-debt', label: 'Zadłużenie' },
              { id: 'missing-tg', label: 'Brak Telegram' }
            ].map((f) => (
              <Badge
                key={f.id}
                variant={activeFilters.includes(f.id) ? 'default' : 'outline'}
                className="cursor-pointer rounded-lg"
                onClick={() => toggleFilter(f.id)}
              >
                {f.label}
              </Badge>
            ))}
          </div>
        </div>

        <div className="ml-auto">
          <Button
            disabled={selectedIds.length === 0}
            onClick={() => setIsSendModalOpen(true)}
            className="rounded-xl transition-all shadow-sm bg-primary hover:bg-primary/90"
          >
            <Send className="w-4 h-4 mr-2" />
            Wyślij wybrane ({selectedIds.length})
          </Button>
        </div>
      </div>

      {/* ТАБЛИЦА */}
      <div className="rounded-xl border bg-card flex-1 overflow-auto custom-scrollbar">
        <Table>
          <TableHeader className="sticky top-0 bg-card z-10 shadow-sm">
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={filtered.length > 0 && selectedIds.length === filtered.length}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Uczeń</TableHead>
              <TableHead>Stan (na 1. dzień)</TableHead>
              <TableHead>Koszt lekcji</TableHead>
              <TableHead>Do zapłaty</TableHead>
              <TableHead>Przedmioty</TableHead>
              <TableHead>Telegram</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((student) => (
              <PendingPaymentsRow
                key={student.alfaId}
                student={student}
                isSelected={selectedIds.includes(student.alfaId)}
                isSent={student.isSent || locallySentIds.includes(student.alfaId)}
                onToggle={handleToggle}
                onPreview={handlePreview}
              />
            ))}
          </TableBody>
        </Table>
      </div>

      {/* 🔥 Модалка предпросмотра (Preview) */}
      <Dialog open={!!previewStudent} onOpenChange={(open) => !open && setPreviewStudent(null)}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Podgląd wiadomości - {previewStudent?.name}</DialogTitle>
          </DialogHeader>
          <div className="bg-secondary p-4 rounded-xl text-sm text-muted-foreground whitespace-pre-wrap font-sans max-h-[60vh] overflow-y-auto">
            {previewStudent?.generatedMessage || 'Wiadomość jest pusta. Sprawdź szablon.'}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              className="w-full rounded-xl"
              onClick={() => {
                if (previewStudent?.generatedMessage) {
                  copyToClipboard(previewStudent.generatedMessage)
                  setPreviewStudent(null)
                }
              }}
            >
              <Copy className="h-4 w-4 mr-2" /> Kopiuj tekst
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 🔥 Наша Универсальная "Тупая" Модалка Рассылки */}
      <SendMessagesModal
        isOpen={isSendModalOpen}
        onOpenChange={setIsSendModalOpen}
        items={selectedStudentsData}
        showSkipSent={true} // Разрешаем пропускать отправленные
        onProcessItem={handleProcessItem}
        onComplete={handleSendComplete}
      />
    </div>
  )
}
