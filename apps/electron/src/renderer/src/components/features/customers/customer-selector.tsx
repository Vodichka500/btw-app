import { useState, useEffect } from 'react'
import { trpc } from '@/lib/trpc'
import { Button } from '@/components/shared/ui/button'
import { Input } from '@/components/shared/ui/input'
import { Badge } from '@/components/shared/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/shared/ui/table'
import { Loader2, Search, ChevronLeft, ChevronRight, Check } from 'lucide-react'
import { Customer } from '@btw-app/shared'
import { cn } from '@/lib/utils'
import { useDebounce } from '@/hooks/use-debounce' // <-- Импортируем хук

interface CustomerSelectorProps {
  onSelect: (customer: Customer) => void
  selectedCustomerId?: number | null
}

export function CustomerSelector({ onSelect, selectedCustomerId }: CustomerSelectorProps) {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')

  // 1. Создаем дебаунс-значение для поиска (задержка 300мс)
  const debouncedSearch = useDebounce(search, 300)

  // 2. Сбрасываем пагинацию на 1 страницу, когда меняется поисковый запрос
  useEffect(() => {
    setPage(1)
  }, [debouncedSearch])

  const { data: teachers = [] } = trpc.teachers.getAll.useQuery()

  const { data, isLoading } = trpc.customer.getSavedCustomers.useQuery({
    page,
    limit: 10,
    search: debouncedSearch || undefined // <-- Отправляем на бэкенд дебаунс-значение
  })

  return (
    <div className="flex flex-col h-[500px] border border-border/50 rounded-2xl bg-background overflow-hidden">
      {/* Search Bar */}
      <div className="p-3 border-b border-border/50 bg-secondary/30 shrink-0 flex gap-2">
        <div className="relative flex-1">
          {/* Показываем лоадер прямо в инпуте, когда запрос летит на бэк */}
          {isLoading && search === debouncedSearch ? (
            <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />
          ) : (
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          )}

          <Input
            placeholder="Szukaj po nazwisku..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            // onKeyDown больше не нужен
            className="pl-9 h-9 text-sm rounded-xl bg-background border-none focus-visible:ring-2 focus-visible:ring-primary/50 w-full"
          />
        </div>
        {/* Кнопка Szukaj удалена */}
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto custom-scrollbar">
        <Table>
          <TableHeader className="bg-secondary/30 sticky top-0 z-10">
            <TableRow className="border-b-border/50">
              <TableHead className="w-[60px]"></TableHead>
              <TableHead className="font-semibold text-foreground">Imię i Nazwisko</TableHead>
              <TableHead className="w-[100px] font-semibold text-foreground">Klasa</TableHead>
              <TableHead className="w-[150px] font-semibold text-foreground">Nauczyciele</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && !data ? (
              <TableRow>
                <TableCell colSpan={4} className="h-48 text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                </TableCell>
              </TableRow>
            ) : !data?.items || data.items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-48 text-center text-muted-foreground text-sm">
                  Nie znaleziono klientów.
                </TableCell>
              </TableRow>
            ) : (
              data.items.map((c) => {
                const isSelected = selectedCustomerId === c.alfaId
                return (
                  <TableRow
                    key={c.alfaId}
                    onClick={() => onSelect(c)}
                    className={cn(
                      'cursor-pointer transition-colors border-b-border/50',
                      isSelected ? 'bg-primary/10 hover:bg-primary/15' : 'hover:bg-secondary/50'
                    )}
                  >
                    <TableCell className="text-center">
                      <div
                        className={cn(
                          'h-5 w-5 rounded-full border-2 flex items-center justify-center mx-auto transition-all',
                          isSelected
                            ? 'bg-primary border-primary text-primary-foreground'
                            : 'border-muted-foreground/20 bg-transparent'
                        )}
                      >
                        {isSelected && <Check className="h-3 w-3" />}
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold text-foreground text-sm">
                      {c.name}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm font-medium">
                      {c.customClass || '—'}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {c.teacherIds && c.teacherIds.length > 0 ? (
                          c.teacherIds.map((tid) => {
                            const teacher = teachers.find(
                              (t) => t.alfacrmId === tid || t.id === tid
                            )
                            return (
                              <Badge
                                key={tid}
                                variant="secondary"
                                className="font-medium bg-secondary/50 text-muted-foreground"
                              >
                                {teacher ? teacher.name : `ID: ${tid}`}
                              </Badge>
                            )
                          })
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {data?.totalPages && data.totalPages > 1 && (
        <div className="flex items-center justify-between p-2 border-t border-border/50 shrink-0 bg-secondary/30">
          <span className="text-xs text-muted-foreground font-medium px-2">
            Razem: {data.total}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1 || isLoading}
              className="h-7 w-7 p-0 rounded-lg"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-xs font-semibold w-12 text-center text-foreground">
              {page} / {data.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
              disabled={page === data.totalPages || isLoading}
              className="h-7 w-7 p-0 rounded-lg"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
