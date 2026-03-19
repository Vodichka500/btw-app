// hooks/use-trash.ts
import { useMemo } from 'react'
import { trpc, type TrashItem } from '@/lib/trpc'
import { toast } from 'sonner'

export function useTrash() {
  const utils = trpc.useUtils()
  const query = trpc.trash.getTrash.useQuery()

  // 🔥 Объединяем категории и сниппеты в один массив
  const items = useMemo((): TrashItem[] => {
    if (!query.data) return []

    const cats = query.data.categories.map((c) => ({
      ...c,
      type: 'category' as const
    }))

    const snips = query.data.snippets.map((s) => ({
      ...s,
      type: 'snippet' as const,
      name: s.title // Маппим title в name для единообразия в UI
    }))

    return [...cats, ...snips].sort((a, b) => {
      const timeA = a.deletedAt ? new Date(a.deletedAt).getTime() : 0
      const timeB = b.deletedAt ? new Date(b.deletedAt).getTime() : 0
      return timeB - timeA
    })
  }, [query.data])

  // Мутации остаются такими же...
  const restoreMut = trpc.trash.restoreItem.useMutation({
    onSuccess: () => {
      utils.trash.getTrash.invalidate()
      utils.categories.getAll.invalidate()
      utils.snippets.getAll.invalidate()
    }
  })

  const hardDeleteMut = trpc.trash.hardDeleteItem.useMutation({
    onSuccess: () => utils.trash.getTrash.invalidate()
  })

  const emptyTrashMut = trpc.trash.emptyTrash.useMutation({
    onSuccess: () => {
      toast.success('Kosz opróżniony')
      utils.trash.getTrash.invalidate()
    }
  })

  return {
    query,
    items, // Теперь это массив TrashItem[]
    restore: (type: 'category' | 'snippet', id: number) => restoreMut.mutateAsync({ type, id }),
    hardDelete: (type: 'category' | 'snippet', id: number) =>
      hardDeleteMut.mutateAsync({ type, id }),
    emptyTrash: () => emptyTrashMut.mutateAsync()
  }
}
