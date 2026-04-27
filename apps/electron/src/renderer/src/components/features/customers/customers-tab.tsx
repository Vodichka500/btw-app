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
import { useDebounce } from '@/hooks/use-debounce'


export function CustomersTab() {
  // 🔥 Оставляем только один стейт для фильтров. Нам больше не нужно разделять
  // localFilters и appliedFilters, так как кнопка "Szukaj" удалена.
  const [filters, setFilters] = useState({
    page: 1,
    search: '',
    customClass: '',
    teacherId: 'all' as string | number, // Храним как string 'all' или number
    noClass: false,
    noTeachers: false
  })

  // 🔥 Применяем debounce к значению поиска (задержка 500мс)
  const debouncedSearch = useDebounce(filters.search, 500)

  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [editingNote, setEditingNote] = useState<{ id: number; value: string } | null>(null)

  const [selectedCustomers, setSelectedCustomers] = useState<Customer[]>([])

  const selectedIds = useMemo(() => selectedCustomers.map((c) => c.alfaId), [selectedCustomers])

  const { data: teachers = [] } = trpc.teachers.getAll.useQuery()

  // 🔥 Запрос теперь слушает `filters` и `debouncedSearch`
  const { data, isLoading, refetch } = trpc.customer.getSavedCustomers.useQuery({
    page: filters.page,
    limit: 50,
    search: debouncedSearch || undefined, // Используем debounced значение!
    customClass: filters.customClass || undefined,
    teacherId: filters.teacherId === 'all' ? undefined : Number(filters.teacherId),
    noClass: filters.noClass ? true : undefined,
    noTeachers: filters.noTeachers ? true : undefined
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

  const handleResetFilters = () => {
    setFilters({
      page: 1,
      search: '',
      customClass: '',
      teacherId: 'all',
      noClass: false,
      noTeachers: false
    })
    setIsFilterOpen(false)
  }

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

  const handleProcessMessage = async (item: any, customMessage: string, targetAudience: string) => {
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
      filters.page > 1 ||
      debouncedSearch ||
      filters.customClass ||
      filters.teacherId !== 'all' ||
      filters.noClass ||
      filters.noTeachers
    )

    let itemsToDisplay: Customer[] = []

    if (!data?.items) {
      itemsToDisplay = hasActiveFilters ? [] : selectedCustomers
    } else if (hasActiveFilters) {
      itemsToDisplay = data.items
    } else {
      const unselectedFromServer = data.items.filter((c) => !selectedIds.includes(c.alfaId))
      itemsToDisplay = [...selectedCustomers, ...unselectedFromServer]
    }

    return itemsToDisplay
  }, [data?.items, selectedCustomers, filters, debouncedSearch, selectedIds])

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
      <div className="flex flex-wrap items-center justify-between gap-3 shrink-0 bg-card p-2 border rounded-2xl shadow-sm">
        {/* ЛЕВАЯ ЧАСТЬ: Поиск */}
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Szukaj po nazwisku lub ID..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
            className="pl-9 border-none bg-transparent shadow-none"
          />
        </div>

        {/* ПРАВАЯ ЧАСТЬ: Кнопки действий */}
        <div className="flex items-center gap-2">
          {selectedCustomers.length > 0 && (
            <Button
              className="rounded-xl transition-all shadow-sm bg-primary hover:bg-primary/90"
              onClick={() => setIsSendModalOpen(true)}
            >
              <Send className="w-4 h-4 mr-2" />
              Wyślij ({selectedCustomers.length})
            </Button>
          )}

          <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="rounded-xl bg-secondary border-border">
                <Filter className="w-4 h-4 mr-2" /> Filtry
              </Button>
            </PopoverTrigger>
            {/* 🔥 Изменили align="start" на align="end" */}
            <PopoverContent className="w-80 p-4 rounded-2xl shadow-xl" align="end">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Klasa ucznia</Label>
                  <Input
                    placeholder="np. 8, 1 kurs..."
                    value={filters.customClass}
                    onChange={(e) =>
                      setFilters({ ...filters, customClass: e.target.value, page: 1 })
                    }
                    disabled={filters.noClass}
                    className="rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Nauczyciel</Label>
                  <Select
                    value={String(filters.teacherId)}
                    onValueChange={(val) => setFilters({ ...filters, teacherId: val, page: 1 })}
                    disabled={filters.noTeachers}
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
                      checked={filters.noClass}
                      onCheckedChange={(c) =>
                        setFilters({ ...filters, noClass: !!c, customClass: '', page: 1 })
                      }
                    />
                    <Label htmlFor="no-class">Brak klasy w CRM</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="no-teachers"
                      checked={filters.noTeachers}
                      onCheckedChange={(c) =>
                        setFilters({ ...filters, noTeachers: !!c, teacherId: 'all', page: 1 })
                      }
                    />
                    <Label htmlFor="no-teachers">Brak przypisanego nauczyciela</Label>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    className="w-full rounded-xl"
                    onClick={handleResetFilters}
                  >
                    <X className="w-4 h-4 mr-2" /> Wyczyść filtry
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
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
              onClick={() => setFilters((p) => ({ ...p, page: Math.max(1, p.page - 1) }))}
              disabled={filters.page === 1}
              className="rounded-lg"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm font-medium w-12 text-center">
              {filters.page} / {data.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setFilters((p) => ({ ...p, page: Math.min(data.totalPages, p.page + 1) }))
              }
              disabled={filters.page === data.totalPages}
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
          // 🔥 Вызываем refetch() при успешном обновлении данных клиента в модалке!
          onSuccess={() => {
            refetch()
            setEditModal({ open: false, customer: null })
          }}
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
