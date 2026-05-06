import { useState, useCallback, useMemo } from 'react'
import { Search, Send, Copy, Loader2, ArrowUpDown } from 'lucide-react'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger
} from '@/components/shared/ui/dropdown-menu'
import { toast } from 'sonner'
import { trpc } from '@/lib/trpc'
import { type UIBillingItem } from '@btw-app/shared'

import { SendMessagesModal } from '../telegram/send-messages-modal'
import { PendingPaymentsRow } from './pending-payments-row'
import { cn } from '@/lib/utils'

interface PendingPaymentsTabProps {
  students: UIBillingItem[]
  monthNum: number
  yearNum: number
  isLoading?: boolean
}

type SortOption =
  | 'name-asc'
  | 'name-desc'
  | 'balance-desc'
  | 'balance-asc'
  | 'topay-desc'
  | 'topay-asc'

export function PendingPaymentsTab({
  students,
  monthNum,
  yearNum,
  isLoading = false
}: PendingPaymentsTabProps) {
  // 1. Context & Stores

  // 2. Local State
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilters, setActiveFilters] = useState<string[]>([])
  const [sortBy, setSortBy] = useState<SortOption>('name-asc')
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [locallySentIds, setLocallySentIds] = useState<number[]>([])
  const [isSendModalOpen, setIsSendModalOpen] = useState(false)
  const [previewStudent, setPreviewStudent] = useState<UIBillingItem | null>(null)

  // 3. API Queries

  // 4. API Mutations
  const sendMutation = trpc.billing.sendSingleBilling.useMutation()

  // 5. Derived State
  const filteredAndSorted = useMemo(() => {
    // Сначала фильтруем
    const result = students.filter((s) => {
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

    // Затем сортируем
    result.sort((a, b) => {
      switch (sortBy) {
        case 'name-asc':
          return a.name.localeCompare(b.name)
        case 'name-desc':
          return b.name.localeCompare(a.name)
        case 'balance-desc':
          return b.currentBalance - a.currentBalance
        case 'balance-asc':
          return a.currentBalance - b.currentBalance
        case 'topay-desc':
          return b.totalToPay - a.totalToPay
        case 'topay-asc':
          return a.totalToPay - b.totalToPay
        default:
          return 0
      }
    })

    return result
  }, [students, searchQuery, activeFilters, locallySentIds, sortBy])

  const selectedStudentsData = students
    .filter((s) => selectedIds.includes(s.alfaId))
    .map((s) => ({
      ...s,
      id: s.alfaId,
      name: s.name,
      isSent: s.isSent || locallySentIds.includes(s.alfaId)
    }))

  // 6. Handlers & Callbacks
  const toggleFilter = (f: string) =>
    setActiveFilters((prev) => (prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]))

  const handleToggle = useCallback((id: number) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }, [])

  const handleSelectAll = () => {
    setSelectedIds(
      selectedIds.length === filteredAndSorted.length ? [] : filteredAndSorted.map((s) => s.alfaId)
    )
  }

  const handlePreview = useCallback((student: UIBillingItem) => {
    setPreviewStudent(student)
  }, [])

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Skopiowano tekst wiadomości')
  }

  const handleProcessItem = async (item) => {
    await sendMutation.mutateAsync({
      month: monthNum,
      year: yearNum,
      message: {
        alfaId: item.id as number,
        name: item.name,
        amountCalculated: item.totalToPay,
        messageBody: item.generatedMessage,
        isSelfPaid: item.isSelfPaid,
        studentTgChatId: item.studentTgChatId,
        parentTgChatId: item.parentTgChatId
      }
    })
  }

  const handleSendComplete = (newlySentIds: Array<string | number>) => {
    if (newlySentIds.length > 0) {
      const numericIds = newlySentIds.map((id) => Number(id))
      setLocallySentIds((prev) => [...prev, ...numericIds])
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
              className="w-[280px] bg-card border border-border/50 pl-10 rounded-xl shadow-sm focus-visible:ring-1 focus-visible:ring-primary"
              disabled={isLoading}
            />
          </div>

          {/* КНОПКА СОРТИРОВКИ */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="rounded-xl shadow-sm border-border/50 bg-card hover:bg-secondary/50"
                disabled={isLoading}
              >
                <ArrowUpDown className="mr-2 h-4 w-4" />
                Sortuj
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 rounded-xl border-border/50">
              <DropdownMenuRadioGroup
                value={sortBy}
                onValueChange={(v) => setSortBy(v as SortOption)}
              >
                <DropdownMenuRadioItem value="name-asc">Od A do Z</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="name-desc">Od Z do A</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="balance-desc">Stan (Malejąco)</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="balance-asc">Stan (Rosnąco)</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="topay-desc">
                  Do zapłaty (Malejąco)
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="topay-asc">
                  Do zapłaty (Rosnąco)
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

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
                className={cn(
                  'rounded-lg font-semibold border-border/50',
                  isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
                  activeFilters.includes(f.id)
                    ? 'bg-primary/10 text-primary border-primary/20'
                    : 'bg-secondary/30 text-muted-foreground hover:bg-secondary/50'
                )}
                onClick={() => !isLoading && toggleFilter(f.id)}
              >
                {f.label}
              </Badge>
            ))}
          </div>
        </div>

        <div className="ml-auto">
          <Button
            disabled={selectedIds.length === 0 || isLoading}
            onClick={() => setIsSendModalOpen(true)}
            className="rounded-xl transition-all shadow-sm"
          >
            <Send className="w-4 h-4 mr-2" />
            Wyślij wybrane ({selectedIds.length})
          </Button>
        </div>
      </div>

      {/* ТАБЛИЦА */}
      <div className="rounded-2xl border border-border/50 bg-card flex-1 overflow-auto custom-scrollbar shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <Table>
          <TableHeader className="sticky top-0 bg-secondary/30 z-10 backdrop-blur-sm">
            <TableRow className="border-b-border/50">
              <TableHead className="w-[50px] p-2">
                <Checkbox
                  className="rounded-md"
                  checked={
                    filteredAndSorted.length > 0 && selectedIds.length === filteredAndSorted.length
                  }
                  onCheckedChange={handleSelectAll}
                  disabled={isLoading || filteredAndSorted.length === 0}
                />
              </TableHead>
              <TableHead className="font-semibold text-foreground">Status</TableHead>
              <TableHead className="font-semibold text-foreground">Uczeń</TableHead>
              <TableHead className="font-semibold text-foreground">Notatka</TableHead>
              <TableHead className="font-semibold text-foreground">Stan (na 1. dzień)</TableHead>
              <TableHead className="font-semibold text-foreground">Koszt lekcji</TableHead>
              <TableHead className="font-semibold text-foreground">Do zapłaty</TableHead>
              <TableHead className="font-semibold text-foreground">Przedmioty</TableHead>
              <TableHead className="font-semibold text-foreground">Telegram</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className={cn(isLoading && 'opacity-50')}>
            {isLoading && students.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="h-[60vh] text-center">
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <div>
                      <p className="text-base font-bold tracking-tight text-foreground">
                        Trwa pobieranie danych z AlfaCRM...
                      </p>
                      <p className="text-sm text-muted-foreground mt-1 font-medium">
                        Może to potrwać do 1 minuty. Proszę czekać.
                      </p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredAndSorted.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={10}
                  className="h-48 text-center text-muted-foreground font-medium"
                >
                  Brak danych do wyświetlenia dla wybranych filtrów.
                </TableCell>
              </TableRow>
            ) : (
              filteredAndSorted.map((student) => (
                <PendingPaymentsRow
                  key={student.alfaId}
                  student={student}
                  isSelected={selectedIds.includes(student.alfaId)}
                  isSent={student.isSent || locallySentIds.includes(student.alfaId)}
                  onToggle={handleToggle}
                  onPreview={handlePreview}
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!previewStudent} onOpenChange={(open) => !open && setPreviewStudent(null)}>
        <DialogContent className="sm:max-w-md rounded-2xl bg-card border-border/50">
          <DialogHeader>
            <DialogTitle className="text-foreground tracking-tight">
              Podgląd wiadomości - {previewStudent?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="bg-secondary/50 p-4 rounded-xl text-sm text-muted-foreground whitespace-pre-wrap font-sans max-h-[60vh] overflow-y-auto custom-scrollbar">
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

      <SendMessagesModal
        isOpen={isSendModalOpen}
        onOpenChange={setIsSendModalOpen}
        items={selectedStudentsData}
        showSkipSent={true}
        getContactId={(item) => (item.isSelfPaid ? item.studentTgChatId : item.parentTgChatId)}
        onProcessItem={handleProcessItem}
        onComplete={handleSendComplete}
        hideAudienceSelector={true}
      />
    </div>
  )
}
