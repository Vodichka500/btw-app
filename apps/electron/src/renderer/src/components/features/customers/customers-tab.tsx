import { useState, useMemo, useCallback } from 'react'
import { trpc } from '@/lib/trpc'
import { Button } from '@/components/shared/ui/button'
import { Input } from '@/components/shared/ui/input'
import { Checkbox } from '@/components/shared/ui/checkbox'
import { Label } from '@/components/shared/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/shared/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/shared/ui/table'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/shared/ui/popover'
import { Loader2, Search, Filter, X, ChevronLeft, ChevronRight, Send } from 'lucide-react'
import { EditCustomerModal } from '@/components/features/customers/edit-customer-modal'
import { SendMessagesModal } from '../telegram/send-messages-modal'
import { Customer } from '@btw-app/shared'
import { toast } from 'sonner'
import { CustomerTableRow } from '@/components/features/customers/customers-tab-row'


export function CustomersTab() {
  const [appliedFilters, setAppliedFilters] = useState({
    page: 1,
    search: '',
    customClass: '',
    teacherId: undefined as number | undefined,
    noClass: false,
    noTeachers: false
  })

  const [localFilters, setLocalFilters] = useState({
    search: '',
    customClass: '',
    teacherId: 'all',
    noClass: false,
    noTeachers: false
  })

  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [editingNote, setEditingNote] = useState<{ id: number; value: string } | null>(null)

  const [selectedCustomers, setSelectedCustomers] = useState<Customer[]>([])

  // 🔥 ОПТИМИЗАЦИЯ: Мемоизируем массив выбранных ID для быстрого поиска
  const selectedIds = useMemo(() => selectedCustomers.map((c) => c.alfaId), [selectedCustomers])

  const { data: teachers = [] } = trpc.teachers.getAll.useQuery()

  const { data, isLoading, refetch } = trpc.customer.getSavedCustomers.useQuery({
    page: appliedFilters.page,
    limit: 50,
    search: appliedFilters.search || undefined,
    customClass: appliedFilters.customClass || undefined,
    teacherId: appliedFilters.teacherId,
    noClass: appliedFilters.noClass ? true : undefined,
    noTeachers: appliedFilters.noTeachers ? true : undefined
  })

  const updateNoteMut = trpc.customer.updateCustomerNote.useMutation({
    onSuccess: () => {
      toast.success('Notatka zapisana pomyślnie')
      setEditingNote(null)
      refetch()
    },
    onError: (err) => toast.error(`Błąd: ${err.message}`)
  })

  const sendMessageMut = trpc.message.sendSingleMessage.useMutation()

  const [editModal, setEditModal] = useState<{ open: boolean; customer: Customer | null }>({
    open: false,
    customer: null
  })
  const [isSendModalOpen, setIsSendModalOpen] = useState(false)

  const handleApplyFilters = () => {
    setAppliedFilters({
      ...appliedFilters,
      page: 1,
      search: localFilters.search,
      customClass: localFilters.customClass,
      teacherId: localFilters.teacherId === 'all' ? undefined : Number(localFilters.teacherId),
      noClass: localFilters.noClass,
      noTeachers: localFilters.noTeachers
    })
    setIsFilterOpen(false)
  }

  const handleResetFilters = () => {
    const resetState = {
      search: '',
      customClass: '',
      teacherId: 'all',
      noClass: false,
      noTeachers: false
    }
    setLocalFilters(resetState)
    setAppliedFilters({ ...appliedFilters, page: 1, ...resetState, teacherId: undefined })
    setIsFilterOpen(false)
  }

  // 🔥 ОПТИМИЗАЦИЯ: Мемоизируем ВСЕ функции, которые передаем в строку
  const handleSaveNote = useCallback(
    (id: number, value: string) => {
      const originalNote = data?.items.find((c) => c.id === id)?.note || ''
      if (value === originalNote) {
        setEditingNote(null)
        return
      }
      updateNoteMut.mutate({ id, note: value || null })
    },
    [data?.items, updateNoteMut]
  )

  const handleDoubleClickNote = useCallback((id: number, value: string) => {
    setEditingNote({ id, value })
  }, [])

  const handleChangeNoteValue = useCallback((value: string) => {
    setEditingNote((prev) => (prev ? { ...prev, value } : null))
  }, [])

  const handleCancelNote = useCallback(() => {
    setEditingNote(null)
  }, [])

  const handleEditCustomer = useCallback((customer: Customer) => {
    setEditModal({ open: true, customer })
  }, [])

  const toggleSelection = useCallback((customer: Customer) => {
    setSelectedCustomers((prev) => {
      if (prev.some((c) => c.alfaId === customer.alfaId)) {
        return prev.filter((c) => c.alfaId !== customer.alfaId)
      } else {
        return [...prev, customer]
      }
    })
  }, [])

  // ... (Остальной код без изменений) ...

  const handleProcessMessage = async (item, customMessage: string, targetAudience: string) => {
    if (!customMessage || !targetAudience) throw new Error('Brak danych wiadomości')
    await sendMessageMut.mutateAsync({
      alfaId: item.id as number,
      messageBody: customMessage,
      targetAudience: targetAudience as 'STUDENT' | 'PARENT',
      studentTgChatId: item.studentTgChatId,
      parentTgChatId: item.parentTgChatId
    })
  }

  const displayItems = useMemo(() => {
    const hasActiveFilters = Boolean(
      appliedFilters.page > 1 ||
      appliedFilters.search ||
      appliedFilters.customClass ||
      appliedFilters.teacherId !== undefined ||
      appliedFilters.noClass ||
      appliedFilters.noTeachers
    )

    if (!data?.items) {
      return hasActiveFilters ? [] : selectedCustomers
    }
    if (hasActiveFilters) {
      return data.items
    }
    const unselectedFromServer = data.items.filter((c) => !selectedIds.includes(c.alfaId))
    return [...selectedCustomers, ...unselectedFromServer]

  }, [data?.items, selectedCustomers, appliedFilters])

  const handleSelectAll = () => {
    const allVisibleSelected =
      displayItems.length > 0 && displayItems.every((c) => selectedIds.includes(c.alfaId))

    if (allVisibleSelected) {
      const visibleIds = displayItems.map((c) => c.alfaId)
      setSelectedCustomers((prev) => prev.filter((c) => !visibleIds.includes(c.alfaId)))
    } else {
      const newSelected = [...selectedCustomers]
      displayItems.forEach((c) => {
        if (!newSelected.some((sel) => sel.alfaId === c.alfaId)) newSelected.push(c)
      })
      setSelectedCustomers(newSelected)
    }
  }

  const formattedSelectedCustomers = useMemo(() => {
    return selectedCustomers.map((c) => ({
      id: c.alfaId,
      name: c.name,
      studentTgChatId: c.studentTgChatId,
      parentTgChatId: c.parentTgChatId
    }))
  }, [selectedCustomers])

  return (
    <div className="space-y-4 flex flex-col h-full">
      {/* ... ШАПКА ФИЛЬТРОВ БЕЗ ИЗМЕНЕНИЙ ... */}
      <div className="flex flex-wrap items-center gap-3 shrink-0 bg-card p-2 border rounded-2xl shadow-sm">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Szukaj po nazwisku lub ID..."
            value={localFilters.search}
            onChange={(e) => setLocalFilters({ ...localFilters, search: e.target.value })}
            onKeyDown={(e) => e.key === 'Enter' && handleApplyFilters()}
            className="pl-9 border-none bg-transparent shadow-none"
          />
        </div>

        <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="rounded-xl bg-secondary border-border">
              <Filter className="w-4 h-4 mr-2" /> Filtry
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-4 rounded-2xl shadow-xl" align="start">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Klasa ucznia</Label>
                <Input
                  placeholder="np. 8, 1 kurs..."
                  value={localFilters.customClass}
                  onChange={(e) =>
                    setLocalFilters({ ...localFilters, customClass: e.target.value })
                  }
                  disabled={localFilters.noClass}
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label>Nauczyciel</Label>
                <Select
                  value={localFilters.teacherId}
                  onValueChange={(val) => setLocalFilters({ ...localFilters, teacherId: val })}
                  disabled={localFilters.noTeachers}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Wszyscy" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Wszyscy nauczyciele</SelectItem>
                    {teachers.map((t) => (
                      <SelectItem key={t.id} value={t.alfacrmId.toString()}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3 pt-2 border-t">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="no-class"
                    checked={localFilters.noClass}
                    onCheckedChange={(c) =>
                      setLocalFilters({ ...localFilters, noClass: !!c, customClass: '' })
                    }
                  />
                  <Label htmlFor="no-class">Brak klasy w CRM</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="no-teachers"
                    checked={localFilters.noTeachers}
                    onCheckedChange={(c) =>
                      setLocalFilters({ ...localFilters, noTeachers: !!c, teacherId: 'all' })
                    }
                  />
                  <Label htmlFor="no-teachers">Brak przypisanego nauczyciela</Label>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  className="flex-1 rounded-xl"
                  onClick={handleResetFilters}
                >
                  <X className="w-4 h-4 mr-2" /> Wyczyść
                </Button>
                <Button className="flex-1 rounded-xl" onClick={handleApplyFilters}>
                  Zastosuj
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <div className="ml-auto flex items-center gap-2">
          {selectedCustomers.length > 0 && (
            <Button
              className="rounded-xl transition-all shadow-sm bg-primary hover:bg-primary/90"
              onClick={() => setIsSendModalOpen(true)}
            >
              <Send className="w-4 h-4 mr-2" />
              Wyślij ({selectedCustomers.length})
            </Button>
          )}
          <Button className="rounded-xl" onClick={handleApplyFilters}>
            Szukaj
          </Button>
        </div>
      </div>

      <div className="bg-card border rounded-2xl shadow-sm flex-1 overflow-auto custom-scrollbar">
        <Table>
          <TableHeader className="bg-muted/50 sticky top-0 z-10">
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={
                    displayItems.length > 0 &&
                    displayItems.every((c) => selectedIds.includes(c.alfaId))
                  }
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead className="w-[80px]">ID</TableHead>
              <TableHead>Imię i Nazwisko</TableHead>
              <TableHead className="w-[100px]">Klasa</TableHead>
              <TableHead className="w-[180px]">Nauczyciele</TableHead>
              <TableHead className="w-[200px]">Notatka (kliknij 2x)</TableHead>
              <TableHead>Płatnik</TableHead>
              <TableHead>TG Ucznia</TableHead>
              <TableHead>TG Rodzica</TableHead>
              <TableHead className="text-right">Akcje</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={10} className="h-32 text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : displayItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="h-32 text-center text-muted-foreground">
                  Nie znaleziono klientów dla podanych filtrów.
                </TableCell>
              </TableRow>
            ) : (
              // 🔥 ИСПОЛЬЗУЕМ НАШ МЕМОИЗИРОВАННЫЙ КОМПОНЕНТ
              displayItems.map((c) => (
                <CustomerTableRow
                  key={c.alfaId}
                  customer={c}
                  isSelected={selectedIds.includes(c.alfaId)}
                  teachers={teachers}
                  editingNoteId={editingNote?.id}
                  editingNoteValue={editingNote?.value}
                  onToggleSelection={toggleSelection}
                  onDoubleClickNote={handleDoubleClickNote}
                  onChangeNoteValue={handleChangeNoteValue}
                  onSaveNote={handleSaveNote}
                  onCancelNote={handleCancelNote}
                  onEditCustomer={handleEditCustomer}
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {data?.totalPages && data.totalPages > 1 && (
        <div className="flex items-center justify-between px-6 py-4 bg-card border rounded-2xl shrink-0">
          <span className="text-sm text-muted-foreground">Razem: {data.total} klientów</span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAppliedFilters((p) => ({ ...p, page: Math.max(1, p.page - 1) }))}
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
                setAppliedFilters((p) => ({ ...p, page: Math.min(data.totalPages, p.page + 1) }))
              }
              disabled={appliedFilters.page === data.totalPages}
              className="rounded-lg"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {editModal.customer && (
        <EditCustomerModal
          open={editModal.open}
          onOpenChange={(open) =>
            setEditModal({ open, customer: open ? editModal.customer : null })
          }
          customer={editModal.customer}
          onSuccess={refetch}
        />
      )}

      <SendMessagesModal
        isOpen={isSendModalOpen}
        onOpenChange={setIsSendModalOpen}
        items={formattedSelectedCustomers}
        requireMessageBody={true}
        showSkipSent={false}
        getContactId={(item, audience) =>
          audience === 'STUDENT' ? item.studentTgChatId : item.parentTgChatId
        }
        onProcessItem={handleProcessMessage}
        onComplete={() => {
          setSelectedCustomers([])
          refetch()
        }}
      />
    </div>
  )
}
