'use client'

import { useState } from 'react'
import { trpc } from '@/lib/trpc'
import { Button } from '@/components/shared/ui/button'
import { Input } from '@/components/shared/ui/input'
import { toast } from 'sonner'
import { differenceInHours, formatDistanceToNow } from 'date-fns'
import { pl } from 'date-fns/locale'
import {
  Loader2,
  Pencil,
  Search,
  RefreshCw,
  AlertTriangle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/shared/ui/table'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/shared/ui/tooltip'
import { EditCustomerModal } from '@/components/features/customers/edit-customer-modal'
import { useDebounce } from '@/hooks/use-debounce'
import { CustomerType } from '@btw-app/shared' // Если есть хук дебаунса, иначе можно встроить

export default function CustomersPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300) // Задержка для поиска, чтобы не спамить БД

  const utils = trpc.useUtils()

  // Получаем токен для работы с Альфой
  const { data: alfaTokenData } = trpc.alfa.getTempToken.useQuery()

  // Запрашиваем локальных пользователей (работает мгновенно)
  const { data, isLoading, refetch } = trpc.customer.getSavedCustomers.useQuery({
    page,
    limit: 50,
    search: debouncedSearch
  })

  const [isSyncing, setIsSyncing] = useState(false)

  const syncMut = trpc.customer.synchronizeCustomers.useMutation({
    onSuccess: () => {
      toast.success('Baza zsynchronizowana pomyślnie!')
      refetch()
    },
    onError: (err) => toast.error(`Błąd synchronizacji: ${err.message}`),
    onSettled: () => setIsSyncing(false)
  })

  // Логика ручной синхронизации
  const handleSync = async () => {
    if (!alfaTokenData?.token) {
      toast.error('Brak tokenu AlfaCRM')
      return // Просто прерываем выполнение, ничего не возвращая
    }

    setIsSyncing(true)
    try {
      const alfaCustomers = await utils.alfa.getRemoteCustomers.fetch({
        alfaTempToken: alfaTokenData.token
      })

      const mappedCustomers = alfaCustomers.map((c) => ({
        alfaId: Number(c.id),
        name: String(c.name)
      }))

      syncMut.mutate({ customers: mappedCustomers })
    } catch (error) {
      toast.error('Nie udało się pobrać danych z AlfaCRM')
      console.error('Błąd pobierania danych z AlfaCRM:', error)
      setIsSyncing(false)
    }
  }

  // Проверка устаревания данных (больше 2 часов)
  const isStale = data?.lastSync
    ? differenceInHours(new Date(), new Date(data.lastSync)) >= 2
    : true // Если синхронизации вообще не было

  const [editModal, setEditModal] = useState<{ open: boolean; customer: CustomerType | null }>({
    open: false,
    customer: null
  })

  return (
    <div className="flex-1 overflow-y-auto bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Klienci (Baza Lokalna)</h1>
            <p className="text-muted-foreground mt-2">Zarządzanie ustawieniami i Telegram ID.</p>
          </div>

          <div className="flex items-center gap-4">
            {isStale && data?.items.length !== 0 && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center text-amber-500 bg-amber-500/10 px-3 py-1.5 rounded-full text-sm font-medium cursor-help">
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      Wymagana synchronizacja
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      Ostatnia synchronizacja:{' '}
                      {data?.lastSync
                        ? formatDistanceToNow(new Date(data.lastSync), {
                            addSuffix: true,
                            locale: pl
                          })
                        : 'Nigdy'}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            <Button onClick={handleSync} disabled={isSyncing} className="rounded-xl">
              <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
              Skanuj AlfaCRM
            </Button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-4 bg-card p-2 border rounded-2xl shadow-sm">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Szukaj po nazwisku lub ID..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              className="pl-9 border-none bg-transparent shadow-none"
            />
          </div>
        </div>

        {/* Таблица */}
        <div className="bg-card border rounded-2xl shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-[100px]">Alfa ID</TableHead>
                <TableHead>Imię i Nazwisko</TableHead>
                <TableHead>Płatnik</TableHead>
                <TableHead>TG Ucznia</TableHead>
                <TableHead>TG Rodzica</TableHead>
                <TableHead className="text-right">Akcje</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : data?.items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                    Brak klientów w bazie. Naciśnij &#34;Skanuj AlfaCRM&#34;.
                  </TableCell>
                </TableRow>
              ) : (
                data?.items.map((c) => (
                  <TableRow key={c.alfaId}>
                    <TableCell className="text-muted-foreground">#{c.alfaId}</TableCell>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${c.isSelfPaid ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}
                      >
                        {c.isSelfPaid ? 'Uczeń' : 'Rodzic'}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm">
                      {c.studentTgChatId ? (
                        <span className="text-emerald-600">✅ {c.studentTgChatId}</span>
                      ) : (
                        '❌'
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {c.parentTgChatId ? (
                        <span className="text-emerald-600">✅ {c.parentTgChatId}</span>
                      ) : (
                        '❌'
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditModal({ open: true, customer: c })}
                      >
                        <Pencil className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Серверная Пагинация */}
          {data?.totalPages && data.totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t bg-muted/20">
              <span className="text-sm text-muted-foreground">Razem: {data.total} klientów</span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm font-medium w-12 text-center">
                  {page} / {data.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                  disabled={page === data.totalPages}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

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
      </div>
    </div>
  )
}
