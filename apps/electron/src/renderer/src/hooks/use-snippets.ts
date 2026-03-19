'use client'

import { useMemo } from 'react'
import { toast } from 'sonner'
import { trpc } from '@/lib/trpc'
import type { CreateSnippetInput, UpdateSnippetInput, ViewMode } from '@btw-app/shared'

export function useSnippets(
  viewMode: ViewMode,
  selectedCategoryId: number | null,
  searchQuery: string
) {
  const utils = trpc.useUtils()
  const query = trpc.snippets.getAll.useQuery({})

  const snippets = useMemo(() => {
    const data = query.data || []
    return [...data].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  }, [query.data])

  const filteredSnippets = useMemo(() => {
    let result = snippets

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (s) => s.title.toLowerCase().includes(q) || s.body.toLowerCase().includes(q)
      )
    }

    if (viewMode === 'favorites') {
      result = result.filter((s) => s.favorite)
    } else if (viewMode === 'category' && selectedCategoryId !== null) {
      result = result.filter((s) => s.categoryId === selectedCategoryId)
    }

    return result
  }, [snippets, viewMode, selectedCategoryId, searchQuery])

  const reorderMut = trpc.snippets.reorder.useMutation({
    onMutate: async (updates) => {
      await utils.snippets.getAll.cancel()
      const previousSnippets = utils.snippets.getAll.getData()

      if (previousSnippets) {
        // Создаем карту новых порядков для быстрого доступа
        const orderMap = new Map(updates.map((u) => [u.id, u.order]))

        const optimistic = [...previousSnippets]
          .map((s) => {
            if (orderMap.has(s.id)) {
              return { ...s, order: orderMap.get(s.id)! }
            }
            return s
          })
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))

        utils.snippets.getAll.setData({}, optimistic)
      }
      return { previousSnippets }
    },
    onError: (_err, _vars, context) => {
      if (context?.previousSnippets) {
        utils.snippets.getAll.setData({}, context.previousSnippets)
      }
    },
    onSettled: () => {
      utils.snippets.getAll.invalidate()
    }
  })

  // Остальные мутации (create, update, delete) без изменений...
  const createMut = trpc.snippets.create.useMutation({
    onSuccess: () => {
      toast.success('Snippet utworzony.')
      utils.snippets.getAll.invalidate()
    },
    onError: () => toast.error('Błąd создания')
  })

  const updateMut = trpc.snippets.update.useMutation({
    onSuccess: () => {
      utils.snippets.getAll.invalidate()
    },
    onError: () => toast.error('Błąd обновления')
  })

  const deleteMut = trpc.snippets.softDelete.useMutation({
    onSuccess: () => {
      toast.success('Usunięto.')
      utils.snippets.getAll.invalidate()
    }
  })

  const toggleFavMut = trpc.snippets.update.useMutation({
    onMutate: async (v) => {
      await utils.snippets.getAll.cancel()
      const prev = utils.snippets.getAll.getData()
      if (prev) {
        utils.snippets.getAll.setData(
          {},
          prev.map((s) => (s.id === v.id ? { ...s, favorite: v.favorite! } : s))
        )
      }
      return { previousSnippets: prev }
    },
    onError: (_, __, ctx) => {
      if (ctx?.previousSnippets) utils.snippets.getAll.setData({}, ctx.previousSnippets)
    },
    onSettled: () => utils.snippets.getAll.invalidate()
  })

  return {
    query,
    snippets,
    filteredSnippets,
    loading: query.isLoading,
    refresh: () => query.refetch(),

    createSnippet: (data: CreateSnippetInput) => createMut.mutateAsync(data),
    updateSnippet: (id: number, data: Partial<UpdateSnippetInput>) =>
      updateMut.mutateAsync({ id, ...data }),
    deleteSnippet: (id: number) => deleteMut.mutateAsync({ id }),
    toggleFavorite: async (id: number) => {
      const s = snippets.find((x) => x.id === id)
      if (s) await toggleFavMut.mutateAsync({ id, favorite: !s.favorite })
    },

    // 🔥 ИСПРАВЛЕННАЯ ЛОГИКА ПЕРЕСТАНОВКИ
    reorderSnippets: async (newOrderSnippetIds: number[]) => {
      const affectedSnippets = snippets.filter((s) => newOrderSnippetIds.includes(s.id))
      const minOrder =
        affectedSnippets.length > 0 ? Math.min(...affectedSnippets.map((s) => s.order ?? 0)) : 0

      const payload = newOrderSnippetIds.map((id, index) => ({
        id,
        order: minOrder + index // Смещение относительно их старой позиции
      }))

      await reorderMut.mutateAsync(payload)
    }
  }
}
