'use client'

import { useState } from 'react'
import { trpc } from '@/lib/trpc'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Loader2, Plus, Pencil, Trash2, UserCog } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  CreateUserSchema,
  AdminUpdateUserSchema,
  type CreateUserInput,
  type AdminUpdateUserInput
} from '@btw-app/shared'
import { format } from 'date-fns'

export default function UsersPage() {
  const currentUser = useAuthStore((s) => s.user)

  // Получаем список юзеров
  const { data: users, isLoading, refetch } = trpc.user.getAll.useQuery()

  // Мутации
  const deleteMut = trpc.user.delete.useMutation({
    onSuccess: () => {
      toast.success('Użytkownik został usunięty')
      setDeleteModal({ open: false, id: null })
      refetch()
    },
    onError: (err) => toast.error(err.message)
  })

  // Стейты модалок
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editModal, setEditModal] = useState<{ open: boolean; user: AdminUpdateUserInput | null }>({
    open: false,
    user: null
  })
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; id: string | null }>({
    open: false,
    id: null
  })

  return (
    <div className="flex-1 overflow-y-auto bg-background p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Хедер */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Zarządzanie użytkownikami</h1>
            <p className="text-muted-foreground mt-2">
              Dodawaj, edytuj i usuwaj nauczycieli oraz administratorów.
            </p>
          </div>
          <Button onClick={() => setIsCreateOpen(true)} className="rounded-xl">
            <Plus className="h-4 w-4 mr-2" />
            Dodaj użytkownika
          </Button>
        </div>

        {/* Таблица */}
        <div className="bg-card border rounded-2xl shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>Imię</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Rola</TableHead>
                <TableHead>Data utworzenia</TableHead>
                <TableHead className="text-right">Akcje</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : users?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
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
                      {format(new Date(u.createdAt), 'dd.MM.yyyy')}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          setEditModal({
                            open: true,
                            user: { id: u.id, email: u.email, name: u.name || '', role: u.role }
                          })
                        }
                      >
                        <Pencil className="h-4 w-4 text-muted-foreground" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteModal({ open: true, id: u.id })}
                        disabled={u.id === currentUser?.id} // Нельзя удалить себя
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

        {/* 1. Модалка Создания */}
        <CreateUserModal open={isCreateOpen} onOpenChange={setIsCreateOpen} onSuccess={refetch} />

        {/* 2. Модалка Редактирования */}
        {editModal.user && (
          <EditUserModal
            open={editModal.open}
            onOpenChange={(open) => setEditModal({ open, user: open ? editModal.user : null })}
            user={editModal.user}
            onSuccess={refetch}
          />
        )}

        {/* 3. Модалка Удаления */}
        <Dialog
          open={deleteModal.open}
          onOpenChange={(open) => setDeleteModal({ open, id: open ? deleteModal.id : null })}
        >
          <DialogContent className="sm:max-w-[425px]">
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
              >
                Anuluj
              </Button>
              <Button
                variant="destructive"
                onClick={() => deleteModal.id && deleteMut.mutate({ id: deleteModal.id })}
                disabled={deleteMut.isLoading}
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

// --- Вспомогательные компоненты модалок (чтобы не раздувать главный компонент) ---

function CreateUserModal({
  open,
  onOpenChange,
  onSuccess
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<CreateUserInput>({
    resolver: zodResolver(CreateUserSchema),
    defaultValues: { role: 'TEACHER' }
  })

  const createMut = trpc.user.create.useMutation({
    onSuccess: () => {
      toast.success('Użytkownik utworzony pomyślnie')
      reset()
      onOpenChange(false)
      onSuccess()
    },
    onError: (err) => toast.error(err.message)
  })

  const onSubmit = (data: CreateUserInput) => createMut.mutate(data)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Dodaj nowego użytkownika</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Imię</Label>
            <Input {...register('name')} placeholder="Jan Kowalski" />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input {...register('email')} type="email" placeholder="jan@example.com" />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Tymczasowe hasło</Label>
            <Input {...register('password')} type="text" placeholder="min. 6 znaków" />
            {errors.password && (
              <p className="text-xs text-destructive">{errors.password.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Rola</Label>
            <select
              {...register('role')}
              className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
            >
              <option value="TEACHER">Nauczyciel</option>
              <option value="ADMIN">Administrator</option>
            </select>
          </div>
          <DialogFooter className="pt-4">
            <Button type="submit" disabled={createMut.isLoading} className="w-full">
              {createMut.isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <UserCog className="h-4 w-4 mr-2" />
              )}
              Stwórz konto
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function EditUserModal({
  open,
  onOpenChange,
  user,
  onSuccess
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: AdminUpdateUserInput
  onSuccess: () => void
}) {
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<AdminUpdateUserInput>({
    resolver: zodResolver(AdminUpdateUserSchema),
    defaultValues: user
  })

  const updateMut = trpc.user.updateByAdmin.useMutation({
    onSuccess: () => {
      toast.success('Dane zaktualizowane')
      onOpenChange(false)
      onSuccess()
    },
    onError: (err) => toast.error(err.message)
  })

  const onSubmit = (data: AdminUpdateUserInput) => updateMut.mutate(data)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edytuj użytkownika</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Imię</Label>
            <Input {...register('name')} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input {...register('email')} type="email" />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Rola</Label>
            <select
              {...register('role')}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="TEACHER">Nauczyciel</option>
              <option value="ADMIN">Administrator</option>
            </select>
          </div>
          <DialogFooter className="pt-4">
            <Button type="submit" disabled={updateMut.isLoading} className="w-full">
              {updateMut.isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Zapisz zmiany
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
