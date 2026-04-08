'use client'

import React, { useState, useCallback } from 'react'
import { Search, Eye, Check, AlertTriangle, Send, Copy } from 'lucide-react'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/shared/ui/table'
import { toast } from 'sonner'
import type { MergedBillingItem } from '@/lib/trpc'
import { SendMessagesModal } from './send-messages-modal'
import { StudentForSend } from '@btw-app/shared'

const formatPLN = (amount: number) =>
  amount.toLocaleString('pl-PL', { style: 'currency', currency: 'PLN' })

type UIStudent = MergedBillingItem & { isSent?: boolean }

const StudentRow = React.memo(
  ({
    student,
    isSelected,
    isSent,
    onToggle,
    onPreview
  }: {
    student: UIStudent
    isSelected: boolean
    isSent: boolean
    onToggle: (id: number) => void
    onPreview: (student: UIStudent) => void
  }) => {
    const hasTg = !!student.studentTgChatId || !!student.parentTgChatId

    return (
      <TableRow className={isSelected ? 'bg-primary/5' : 'hover:bg-muted/50 transition-colors'}>
        <TableCell>
          {/* Убрали disabled={isSent}, теперь можно выбирать кого угодно */}
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
StudentRow.displayName = 'StudentRow'

// ==============================================================
// ГЛАВНЫЙ КОМПОНЕНТ ТАБЛИЦЫ
// ==============================================================
export function PendingPaymentsTab({
  students,
  monthNum,
  yearNum
}: {
  students: UIStudent[]
  monthNum: number
  yearNum: number
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilters, setActiveFilters] = useState<string[]>([])
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [locallySentIds, setLocallySentIds] = useState<number[]>([])

  // Стейты модалок
  const [isSendModalOpen, setIsSendModalOpen] = useState(false)
  const [previewStudent, setPreviewStudent] = useState<UIStudent | null>(null) // Глобальный предпросмотр

  const toggleFilter = (f: string) =>
    setActiveFilters((prev) => (prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]))

  const filtered = students.filter((s) => {
    const isSent = s.isSent || locallySentIds.includes(s.alfaId)
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase())
    const hasTg = !!s.studentTgChatId || !!s.parentTgChatId

    const matchesFilters =
      activeFilters.length === 0 ||
      (activeFilters.includes('has-remainder') && s.currentBalance > 0) ||
      (activeFilters.includes('has-debt') && s.currentBalance < 0) ||
      (activeFilters.includes('missing-tg') && !hasTg) ||
      (activeFilters.includes('sent') && isSent) ||
      (activeFilters.includes('not-sent') && !isSent)

    return matchesSearch && matchesFilters
  })

  // Используем useCallback, чтобы React.memo в строках работал эффективно
  const handleToggle = useCallback((id: number) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }, [])

  const handleSelectAll = () => {
    setSelectedIds(selectedIds.length === filtered.length ? [] : filtered.map((s) => s.alfaId))
  }

  const handlePreview = useCallback((student: UIStudent) => {
    setPreviewStudent(student)
  }, [])

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Skopiowano tekst wiadomości')
  }

  const selectedStudentsData: StudentForSend[] = students
    .filter((s) => selectedIds.includes(s.alfaId))
    .map((s) => ({
      alfaId: s.alfaId,
      name: s.name,
      amountCalculated: s.totalToPay,
      messageBody: s.generatedMessage || '',
      isSelfPaid: s.isSelfPaid,
      studentTgChatId: s.studentTgChatId,
      parentTgChatId: s.parentTgChatId,
      isSent: s.isSent || locallySentIds.includes(s.alfaId),
      hasTg: !!s.studentTgChatId || !!s.parentTgChatId
    }))

  const handleSendComplete = (newlySentIds: number[]) => {
    if (newlySentIds.length > 0) {
      setLocallySentIds((prev) => [...prev, ...newlySentIds])
    }
    setSelectedIds([])
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
              <TableHead>Status wysyłki</TableHead>
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
              <StudentRow
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

      {/* 🔥 1. Глобальная модалка предпросмотра (вместо сотен Popover) */}
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

      {/* 🔥 2. Модалка рассылки с настройками */}
      <SendMessagesModal
        isOpen={isSendModalOpen}
        onOpenChange={setIsSendModalOpen}
        selectedStudents={selectedStudentsData}
        monthNum={monthNum}
        yearNum={yearNum}
        onComplete={handleSendComplete}
      />
    </div>
  )
}
