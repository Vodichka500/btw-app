import { useState } from 'react'
import { trpc } from '@/lib/trpc'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/shared/ui/button'
import { Input } from '@/components/shared/ui/input'
import { Label } from '@/components/shared/ui/label'
import { toast } from 'sonner'
import { Loader2, Plus, Pencil, Trash2, UserCog, Check, ChevronsUpDown, Save } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/shared/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/shared/ui/dialog'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/shared/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/shared/ui/popover'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  CreateUserSchema,
  AdminUpdateUserSchema,
  type CreateUserInput,
  type AdminUpdateUserInput
} from '@btw-app/shared'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

export default function UsersPage() {
  const currentUser = useAuthStore((s) => s.user)

  const { data: users, isLoading, refetch } = trpc.user.getAll.useQuery()

  const deleteMut = trpc.user.delete.useMutation({
    onSuccess: () => {
      toast.success('Użytkownik został usunięty')
      setDeleteModal({ open: false, id: null })
      refetch()
    },
    onError: (err) => toast.error(err.message)
  })

  // 🔥 ЕДИНЫЙ СТЕЙТ ДЛЯ МОДАЛКИ (null = создание, объект = редактирование)
  const [formModal, setFormModal] = useState<{
    open: boolean
    user: (AdminUpdateUserInput & { tgChatId?: string | null }) | null
  }>({ open: false, user: null })

  const [deleteModal, setDeleteModal] = useState<{ open: boolean; id: string | null }>({
    open: false,
    id: null
  })

  return (
    <div className="flex-1 overflow-y-auto bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Zarządzanie użytkownikami</h1>
            <p className="text-muted-foreground mt-2">
              Dodawaj, edytuj i usuwaj nauczycieli oraz administratorów.
            </p>
          </div>
          {/* 🔥 КНОПКА СОЗДАНИЯ */}
          <Button onClick={() => setFormModal({ open: true, user: null })} className="rounded-xl">
            <Plus className="h-4 w-4 mr-2" />
            Dodaj użytkownika
          </Button>
        </div>

        <div className="bg-card border rounded-2xl shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>Imię</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Rola</TableHead>
                <TableHead>Powiązany nauczyciel</TableHead>
                <TableHead>Telegram Chat ID</TableHead>
                <TableHead>Data utworzenia</TableHead>
                <TableHead className="text-right">Akcje</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : users?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                    Brak użytkowników.
                  </TableCell>
                </TableRow>
              ) : (
                users?.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.name || '—'}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          u.role === 'ADMIN'
                            ? 'bg-primary/10 text-primary'
                            : 'bg-secondary text-secondary-foreground'
                        }`}
                      >
                        {u.role === 'ADMIN' ? 'Administrator' : 'Nauczyciel'}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {u.teacher?.name ? (
                        <span className="flex items-center gap-1.5 text-sm">{u.teacher.name}</span>
                      ) : (
                        <span className="italic opacity-50">Brak</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground font-mono text-sm">
                      {u.tgChatId || <span className="italic opacity-50">Brak</span>}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(u.createdAt), 'dd.MM.yyyy')}
                    </TableCell>
                    <TableCell className="text-right">
                      {/* 🔥 КНОПКА РЕДАКТИРОВАНИЯ */}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          setFormModal({
                            open: true,
                            user: {
                              id: u.id,
                              email: u.email,
                              name: u.name || '',
                              role: u.role,
                              teacherId: u.teacherId,
                              tgChatId: u.tgChatId
                            }
                          })
                        }
                      >
                        <Pencil className="h-4 w-4 text-muted-foreground" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteModal({ open: true, id: u.id })}
                        disabled={u.id === currentUser?.id}
                        className="hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* 🔥 ЕДИНАЯ УНИВЕРСАЛЬНАЯ МОДАЛКА */}
        <UserFormModal
          open={formModal.open}
          onOpenChange={(open) => setFormModal({ open, user: open ? formModal.user : null })}
          user={formModal.user}
          onSuccess={refetch}
        />

        <Dialog
          open={deleteModal.open}
          onOpenChange={(open) => setDeleteModal({ open, id: open ? deleteModal.id : null })}
        >
          <DialogContent className="sm:max-w-[425px] rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-destructive">Usuń użytkownika</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              Czy na pewno chcesz usunąć tego użytkownika? Tej operacji nie można cofnąć.
            </p>
            <DialogFooter className="mt-4">
              <Button
                variant="outline"
                onClick={() => setDeleteModal({ open: false, id: null })}
                disabled={deleteMut.isLoading}
                className="rounded-xl"
              >
                Anuluj
              </Button>
              <Button
                variant="destructive"
                onClick={() => deleteModal.id && deleteMut.mutate({ id: deleteModal.id })}
                disabled={deleteMut.isLoading}
                className="rounded-xl"
              >
                {deleteMut.isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Usuń
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

/// ==========================================
// 🛠 УНИВЕРСАЛЬНАЯ МОДАЛКА (Оболочка)
// ==========================================
function UserFormModal({
  open,
  onOpenChange,
  user,
  onSuccess
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: AdminUpdateUserInput | null
  onSuccess: () => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] overflow-visible rounded-2xl">
        <DialogHeader>
          <DialogTitle>{user ? 'Edytuj użytkownika' : 'Dodaj nowego użytkownika'}</DialogTitle>
        </DialogHeader>

        {/* Рендерим нужную форму в зависимости от того, передан ли user */}
        {user ? (
          <EditUserForm user={user} onClose={() => onOpenChange(false)} onSuccess={onSuccess} />
        ) : (
          <CreateUserForm onClose={() => onOpenChange(false)} onSuccess={onSuccess} />
        )}
      </DialogContent>
    </Dialog>
  )
}

// ==========================================
// 🟢 ФОРМА СОЗДАНИЯ (Строгий тип CreateUserInput)
// ==========================================
function CreateUserForm({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const { data: teachers } = trpc.teachers.getAll.useQuery()
  const [comboboxOpen, setComboboxOpen] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<CreateUserInput>({
    resolver: zodResolver(CreateUserSchema),
    defaultValues: { role: 'TEACHER', teacherId: null, tgChatId: '' }
  })

  const selectedTeacherId = watch('teacherId')

  const createMut = trpc.user.create.useMutation({
    onSuccess: () => {
      toast.success('Użytkownik utworzony pomyślnie')
      onClose()
      onSuccess()
    },
    onError: (err) => toast.error(err.message)
  })

  const onSubmit = (data: CreateUserInput) => {
    const cleanedTgChatId = data.tgChatId?.trim() ? data.tgChatId.trim() : null
    createMut.mutate({ ...data, tgChatId: cleanedTgChatId })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
      <div className="space-y-2">
        <Label>Imię</Label>
        <Input {...register('name')} placeholder="Jan Kowalski" className="rounded-xl" />
        {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
      </div>

      <div className="space-y-2">
        <Label>Email</Label>
        <Input
          {...register('email')}
          type="email"
          placeholder="jan@example.com"
          className="rounded-xl"
        />
        {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
      </div>

      <div className="space-y-2">
        <Label>Tymczasowe hasło</Label>
        <Input
          {...register('password')}
          type="text"
          placeholder="min. 6 znaków"
          className="rounded-xl"
        />
        {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
      </div>

      <div className="space-y-2">
        <Label>Rola</Label>
        <select
          {...register('role')}
          className="flex h-10 w-full items-center justify-between rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background"
        >
          <option value="TEACHER">Nauczyciel</option>
          <option value="ADMIN">Administrator</option>
        </select>
      </div>

      <div className="space-y-2">
        <Label>Telegram Chat ID (Opcjonalnie)</Label>
        <Input {...register('tgChatId')} placeholder="np. 123456789" className="rounded-xl" />
        {errors.tgChatId && <p className="text-xs text-destructive">{errors.tgChatId.message}</p>}
      </div>

      <div className="space-y-2 flex flex-col">
        <Label>Powiąż z nauczycielem w systemie</Label>
        <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={comboboxOpen}
              className="w-full justify-between rounded-xl"
            >
              {selectedTeacherId
                ? teachers?.find((t) => t.id === selectedTeacherId)?.name
                : 'Wybierz nauczyciela (opcjonalnie)'}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[375px] p-0 z-[100] rounded-xl" align="start">
            <Command>
              <CommandInput placeholder="Szukaj nauczyciela..." />
              <CommandList>
                <CommandEmpty>Nie znaleziono nauczyciela.</CommandEmpty>
                <CommandGroup>
                  <CommandItem
                    value="brak"
                    onSelect={() => {
                      setValue('teacherId', null)
                      setComboboxOpen(false)
                    }}
                    className="italic text-muted-foreground"
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        !selectedTeacherId ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    Brak powiązania
                  </CommandItem>
                  {teachers?.map((t) => (
                    <CommandItem
                      key={t.id}
                      value={t.name}
                      onSelect={() => {
                        setValue('teacherId', t.id)
                        setComboboxOpen(false)
                      }}
                    >
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4',
                          selectedTeacherId === t.id ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                      {t.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      <DialogFooter className="pt-4">
        <Button type="submit" disabled={createMut.isLoading} className="w-full rounded-xl">
          {createMut.isLoading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <UserCog className="h-4 w-4 mr-2" />
          )}
          Stwórz konto
        </Button>
      </DialogFooter>
    </form>
  )
}

// ==========================================
// 🟡 ФОРМА РЕДАКТИРОВАНИЯ (Строгий тип AdminUpdateUserInput)
// ==========================================
function EditUserForm({
  user,
  onClose,
  onSuccess
}: {
  user: AdminUpdateUserInput
  onClose: () => void
  onSuccess: () => void
}) {
  const { data: teachers } = trpc.teachers.getAll.useQuery()
  const [comboboxOpen, setComboboxOpen] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<AdminUpdateUserInput>({
    resolver: zodResolver(AdminUpdateUserSchema),
    defaultValues: { ...user, tgChatId: user.tgChatId || '' }
  })

  const selectedTeacherId = watch('teacherId')

  const updateMut = trpc.user.updateByAdmin.useMutation({
    onSuccess: () => {
      toast.success('Dane zaktualizowane')
      onClose()
      onSuccess()
    },
    onError: (err) => toast.error(err.message)
  })

  const onSubmit = (data: AdminUpdateUserInput) => {
    const cleanedTgChatId = data.tgChatId?.trim() ? data.tgChatId.trim() : null
    updateMut.mutate({ ...data, tgChatId: cleanedTgChatId })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
      <div className="space-y-2">
        <Label>Imię</Label>
        <Input {...register('name')} className="rounded-xl" />
        {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
      </div>

      <div className="space-y-2">
        <Label>Email</Label>
        <Input {...register('email')} type="email" className="rounded-xl" />
        {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
      </div>

      <div className="space-y-2">
        <Label>Rola</Label>
        <select
          {...register('role')}
          className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="TEACHER">Nauczyciel</option>
          <option value="ADMIN">Administrator</option>
        </select>
      </div>

      <div className="space-y-2">
        <Label>Telegram Chat ID (Opcjonalnie)</Label>
        <Input {...register('tgChatId')} placeholder="np. 123456789" className="rounded-xl" />
        {errors.tgChatId && <p className="text-xs text-destructive">{errors.tgChatId.message}</p>}
      </div>

      <div className="space-y-2 flex flex-col">
        <Label>Powiąż z nauczycielem w systemie</Label>
        <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={comboboxOpen}
              className="w-full justify-between rounded-xl"
            >
              {selectedTeacherId
                ? teachers?.find((t) => t.id === selectedTeacherId)?.name
                : 'Wybierz nauczyciela (opcjonalnie)'}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[375px] p-0 z-[100] rounded-xl" align="start">
            <Command>
              <CommandInput placeholder="Szukaj nauczyciela..." />
              <CommandList>
                <CommandEmpty>Nie znaleziono nauczyciela.</CommandEmpty>
                <CommandGroup>
                  <CommandItem
                    value="brak"
                    onSelect={() => {
                      setValue('teacherId', null)
                      setComboboxOpen(false)
                    }}
                    className="italic text-muted-foreground"
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        !selectedTeacherId ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    Brak powiązania
                  </CommandItem>
                  {teachers?.map((t) => (
                    <CommandItem
                      key={t.id}
                      value={t.name}
                      onSelect={() => {
                        setValue('teacherId', t.id)
                        setComboboxOpen(false)
                      }}
                    >
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4',
                          selectedTeacherId === t.id ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                      {t.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      <DialogFooter className="pt-4">
        <Button type="submit" disabled={updateMut.isLoading} className="w-full rounded-xl">
          {updateMut.isLoading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Zapisz zmiany
        </Button>
      </DialogFooter>
    </form>
  )
}
