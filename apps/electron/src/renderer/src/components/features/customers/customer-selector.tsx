import { useState } from 'react'
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

interface CustomerSelectorProps {
  onSelect: (customer: Customer) => void
  selectedCustomerId?: number | null // ID выбранного ученика (alfaId)
}

export function CustomerSelector({ onSelect, selectedCustomerId }: CustomerSelectorProps) {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [appliedSearch, setAppliedSearch] = useState('')

  const { data: teachers = [] } = trpc.teachers.getAll.useQuery()

  const { data, isLoading } = trpc.customer.getSavedCustomers.useQuery({
    page,
    limit: 10, // Для модалки лучше грузить поменьше
    search: appliedSearch || undefined
  })

  const handleApplySearch = () => {
    setPage(1)
    setAppliedSearch(search)
  }

  return (
    <div className="flex flex-col h-[500px] border border-border rounded-xl bg-card overflow-hidden">
      {/* Search Bar */}
      <div className="p-3 border-b border-border bg-muted/20 shrink-0 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Szukaj po nazwisku..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleApplySearch()}
            className="pl-9 h-9 text-sm rounded-lg bg-background"
          />
        </div>
        <Button size="sm" onClick={handleApplySearch} className="h-9 rounded-lg">
          Szukaj
        </Button>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto custom-scrollbar">
        <Table>
          <TableHeader className="bg-muted/50 sticky top-0 z-10">
            <TableRow>
              <TableHead className="w-[60px]"></TableHead>
              <TableHead>Imię i Nazwisko</TableHead>
              <TableHead className="w-[100px]">Klasa</TableHead>
              <TableHead className="w-[150px]">Nauczyciele</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="h-32 text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : !data?.items || data.items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-32 text-center text-muted-foreground text-sm">
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
                      'cursor-pointer transition-colors',
                      isSelected ? 'bg-primary/10 hover:bg-primary/15' : 'hover:bg-muted/50'
                    )}
                  >
                    <TableCell className="text-center">
                      <div
                        className={cn(
                          'h-5 w-5 rounded-full border flex items-center justify-center mx-auto',
                          isSelected
                            ? 'bg-primary border-primary text-primary-foreground'
                            : 'border-muted-foreground/30'
                        )}
                      >
                        {isSelected && <Check className="h-3 w-3" />}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium text-sm">{c.name}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
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
                                className="text-[10px] px-1.5 py-0"
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
        <div className="flex items-center justify-between p-3 border-t border-border shrink-0 bg-muted/10">
          <span className="text-xs text-muted-foreground font-medium">Razem: {data.total}</span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="h-7 w-7 p-0 rounded-md"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-xs font-medium w-10 text-center">
              {page} / {data.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
              disabled={page === data.totalPages}
              className="h-7 w-7 p-0 rounded-md"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
