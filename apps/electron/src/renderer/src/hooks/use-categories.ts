import { useCallback } from 'react'
import { toast } from 'sonner'
import { trpc } from '@/lib/trpc'
import type { ChangeOrderCategoryInput } from '@btw-app/shared'
import { CategoryNode } from '@/lib/trpc'



function findCategoryNode(nodes: CategoryNode[], id: number): CategoryNode | null {
  for (const node of nodes) {
    if (node.id === id) return node
    if (node.children) {
      const found = findCategoryNode(node.children, id)
      if (found) return found
    }
  }
  return null
}

export function useCategories() {
  const utils = trpc.useUtils()

  const query = trpc.categories.getAll.useQuery()

  const createMut = trpc.categories.create.useMutation({
    onSuccess: () => {
      toast.success('Kategoria utworzona.')
      utils.categories.getAll.invalidate()
    },
    onError: () => toast.error('Błąd podczas tworzenia kategorii')
  })

  const updateMut = trpc.categories.update.useMutation({
    onSuccess: () => {
      toast.success('Kategoria zaktualizowana.')
      utils.categories.getAll.invalidate()
    },
    onError: () => toast.error('Błąd podczas aktualizacji kategorii')
  })

  const deleteMut = trpc.categories.softDelete.useMutation({
    onSuccess: () => {
      toast.success('Kategoria przeniesiona do kosza.')
      utils.categories.getAll.invalidate()
      utils.snippets.getAll.invalidate()
    },
    onError: () => toast.error('Błąd podczas usuwania kategorii')
  })


  const structureMut = trpc.categories.updateStructure.useMutation({
    onSuccess: () => utils.categories.getAll.invalidate(),
    onError: () => toast.error('Błąd podczas aktualizacji struktury kategorii')
  })

  const getSubcategories = useCallback(
    (parentId: number | null): CategoryNode[] => {
      const currentCategories = query.data || []
      if (parentId === null) return currentCategories

      const parent = findCategoryNode(currentCategories, parentId)
      return parent?.children || []
    },
    [query.data]
  )

  return {
    query,
    categories: query.data || [],
    loading: query.isLoading,

    createCategory: async (name: string, parentId?: number) => {
      await createMut.mutateAsync({ name, parentId })
    },
    updateCategory: async (id: number, name: string) => {
      await updateMut.mutateAsync({ id, name })
    },
    deleteCategory: async (id: number, withSnippets: boolean) => {
      try {
        deleteMut.mutateAsync({ id, withSnippets })
        return true
      } catch {
        return false
      }
    },
    updateCategoryStructure: async (updates: ChangeOrderCategoryInput[]) => {
      await structureMut.mutateAsync(updates)
    },
    getSubcategories
  }
}
