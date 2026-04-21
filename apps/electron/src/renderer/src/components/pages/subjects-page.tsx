'use client'

// 1. React
import { useState, useMemo, useCallback } from 'react'

// 2. Сторонние библиотеки
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { differenceInHours, formatDistanceToNow } from 'date-fns'
import { pl } from 'date-fns/locale'
import { Loader2, Pencil, Search, RefreshCw, AlertTriangle, BookOpen } from 'lucide-react'
import { toast } from 'sonner'

// 3. Абсолютные импорты (API, Утилиты)
import { trpc } from '@/lib/trpc'
import {
  UpdateAlfaSubjectSchema,
  type UpdateAlfaSubjectInput,
  type DbAlfaSubject
} from '@btw-app/shared'

// 4. Абсолютные импорты (UI Компоненты)
import { Button } from '@/components/shared/ui/button'
import { Input } from '@/components/shared/ui/input'
import { Label } from '@/components/shared/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/shared/ui/table'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/shared/ui/tooltip'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/shared/ui/dialog'

export default function SubjectsPage() {
  // // 1. Local State & Refs
  const [search, setSearch] = useState('')
  const [editModal, setEditModal] = useState<{ open: boolean; subject: DbAlfaSubject | null }>({
    open: false,
    subject: null
  })

  // // 2. API Queries
  const { data, isLoading, refetch } = trpc.alfaSubject.getSavedSubjects.useQuery()

  // // 3. API Mutations
  const syncMut = trpc.alfaSubject.synchronizeSubjects.useMutation({
    onSuccess: (res) => {
      if (res.added > 0) {
        toast.success(`Baza zsynchronizowana. Dodano ${res.added} nowych przedmiotów.`)
      } else {
        toast.success('Baza jest aktualna. Brak nowych przedmiotów.')
      }
      refetch()
    },
    onError: (err) => toast.error(`Błąd synchronizacji: ${err.message}`)
  })

  // // 4. Derived State (useMemo)
  const isStale = useMemo(() => {
    if (!data?.lastSync) return true
    return differenceInHours(new Date(), new Date(data.lastSync)) >= 24
  }, [data?.lastSync])

  const filteredSubjects = useMemo(() => {
    if (!data?.items) return []
    return data.items.filter(
      (s) =>
        s.name.toLowerCase().includes(search.toLowerCase()) || s.alfaId.toString().includes(search)
    )
  }, [data?.items, search])

  // // 5. Handlers & Callbacks
  const handleSync = useCallback(() => {
    // 🔥 Фронт просто говорит "Бэк, обнови базу!" и не гоняет мегабайты данных по сети
    syncMut.mutate()
  }, [syncMut])

  // // 6. Main Return (JSX)
  return (
    <div className="flex-1 overflow-y-auto bg-background p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* HEADER */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Przedmioty</h1>
            <p className="text-muted-foreground mt-2">
              Zarządzanie listą przedmiotów i ich wyświetlanymi nazwami.
            </p>
          </div>

          <div className="flex items-center gap-4">
            {isStale && data?.items && data.items.length !== 0 && (
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

            <Button onClick={handleSync} disabled={syncMut.isPending} className="rounded-xl">
              <RefreshCw className={`h-4 w-4 mr-2 ${syncMut.isPending ? 'animate-spin' : ''}`} />
              Skanuj AlfaCRM
            </Button>
          </div>
        </div>

        {/* SEARCH BAR */}
        <div className="flex items-center gap-4 bg-card p-2 border rounded-2xl shadow-sm">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Szukaj po nazwie lub ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 border-none bg-transparent shadow-none"
            />
          </div>
        </div>

        {/* TABLE */}
        <div className="bg-card border rounded-2xl shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-[100px]">Alfa ID</TableHead>
                <TableHead>Nazwa wyświetlana (Lokalna)</TableHead>
                <TableHead className="text-right">Akcje</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={3} className="h-32 text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : filteredSubjects.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="h-32 text-center text-muted-foreground">
                    Brak przedmiotów w bazie. Naciśnij &#34;Skanuj AlfaCRM&#34; lub zmień parametry
                    wyszukiwania.
                  </TableCell>
                </TableRow>
              ) : (
                filteredSubjects.map((s) => (
                  <TableRow key={s.alfaId}>
                    <TableCell className="text-muted-foreground font-mono">#{s.alfaId}</TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-primary" />
                        {s.name}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditModal({ open: true, subject: s as DbAlfaSubject })}
                      >
                        <Pencil className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {data?.items && data.items.length > 0 && (
            <div className="px-6 py-4 border-t bg-muted/20">
              <span className="text-sm text-muted-foreground">
                Razem: {data.items.length} przedmiotów
              </span>
            </div>
          )}
        </div>

        {/* MODAL */}
        {editModal.subject && (
          <EditSubjectModal
            open={editModal.open}
            onOpenChange={(open) =>
              setEditModal({ open, subject: open ? editModal.subject : null })
            }
            subject={editModal.subject}
            onSuccess={refetch}
          />
        )}
      </div>
    </div>
  )
}

// ==========================================
// 🛠 ВНУТРЕННЯЯ МОДАЛКА (РЕДАКТИРОВАНИЕ)
// ==========================================
type EditSubjectModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  subject: DbAlfaSubject
  onSuccess: () => void
}

function EditSubjectModal({ open, onOpenChange, subject, onSuccess }: EditSubjectModalProps) {
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<UpdateAlfaSubjectInput>({
    resolver: zodResolver(UpdateAlfaSubjectSchema),
    defaultValues: {
      alfaId: subject.alfaId,
      name: subject.name
    }
  })

  const updateMut = trpc.alfaSubject.updateName.useMutation({
    onSuccess: () => {
      toast.success('Nazwa przedmiotu została zaktualizowana')
      onOpenChange(false)
      onSuccess()
    },
    onError: (err) => toast.error(err.message)
  })

  const onSubmit = (data: UpdateAlfaSubjectInput) => {
    updateMut.mutate({
      alfaId: data.alfaId,
      name: data.name.trim()
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] rounded-2xl">
        <DialogHeader>
          <DialogTitle>Edytuj przedmiot</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Nazwa przedmiotu</Label>
            <Input {...register('name')} placeholder="np. Matematyka" className="rounded-xl" />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            <p className="text-xs text-muted-foreground">
              Ta nazwa będzie używana w powiadomieniach i rachunkach dla klientów zamiast
              oryginalnej nazwy z AlfaCRM.
            </p>
          </div>

          <DialogFooter className="pt-4">
            <Button type="submit" disabled={updateMut.isPending} className="w-full rounded-xl">
              {updateMut.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Zapisz zmiany
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
