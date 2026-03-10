import { useState, useCallback, useEffect } from 'react'
import { toast } from 'sonner'
import { CategoryWithChildren, ChangeOrderCategoryInput } from '@btw-app/shared'

function findCategoryNode(nodes: CategoryWithChildren[], id: number): CategoryWithChildren | null {
  for (const node of nodes) {
    if (node.id === id) return node
    if (node.children) {
      const found = findCategoryNode(node.children, id)
      if (found) return found
    }
  }
  return null
}

export interface UseCategoriesReturn {
  categories: CategoryWithChildren[]
  loading: boolean
  fetchCategories: () => Promise<void>
  createCategory: (name: string, parentId?: number) => Promise<void>
  updateCategory: (id: number, name: string) => Promise<void>
  deleteCategory: (id: number) => Promise<boolean>
  getSubcategories: (parentId: number | null) => CategoryWithChildren[]
  updateCategoryStructure: (updates: ChangeOrderCategoryInput[]) => Promise<void>
}

export function useCategories(): UseCategoriesReturn {
  const [categories, setCategories] = useState<CategoryWithChildren[]>([])
  const [loading, setLoading] = useState(true)

  const fetchCategories = useCallback(async () => {
    setLoading(true)
    try {
      const data = await window.api.getCategories()
      setCategories(data)
    } catch (error) {
      console.error(error)
      toast.error('Failed to load categories.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  const createCategory = async (name: string, parentId?: number) => {
    try {
      await window.api.createCategory({ name, parentId })
      toast.success('Kategoria utworzona.')
      await fetchCategories()
    } catch (e) {
      toast.error('Błąd podczas tworzenia kategorii')
    }
  }

  const updateCategory = async (id: number, name: string) => {
    try {
      await window.api.updateCategory({ id, name })
      toast.success('Kategoria zaktualizowana.')
      await fetchCategories()
    } catch (e) {
      toast.error('Bląd podczas aktualizacji kategorii')
    }
  }

  const deleteCategory = async (id: number) => {
    try {
      await window.api.deleteCategory(id)
      toast.success('Kategoria przeniesiona do kosza.')
      await fetchCategories()
      // Возвращаем true, чтобы компонент знал, что удаление прошло успешно (например, для сброса выделения)
      return true
    } catch (e) {
      toast.error('Bląd podczas usuwania kategorii')
      return false
    }
  }

  const getSubcategories = useCallback(
    (parentId: number | null): CategoryWithChildren[] => {
      if (parentId === null) {
        return categories
      }

      const parent = findCategoryNode(categories, parentId)
      return parent?.children || []
    },
    [categories]
  )

  const updateCategoryStructure = async (updates: ChangeOrderCategoryInput[]): Promise<void> => {
    try {
      await window.api.updateCategoryStructure(updates)
      await fetchCategories() // Синхронизируемся
    } catch (e) {
      toast.error('Blad podczas aktualizacji struktury kategorii')
    }
  }

  return {
    categories,
    loading,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    getSubcategories,
    updateCategoryStructure
  }
}
