import { useState, useCallback, useEffect, useMemo } from 'react'
import { toast } from 'sonner'
import { SnippetWithCategory, CreateSnippetInput, UpdateSnippetInput } from '@btw-app/shared'
import { ViewMode } from '@btw-app/shared'


export interface UseSnippetsReturn {
  snippets: SnippetWithCategory[]
  filteredSnippets: SnippetWithCategory[]
  loading: boolean
  refresh: () => Promise<void>
  createSnippet: (data: CreateSnippetInput) => Promise<void>
  updateSnippet: (id: number, data: Partial<UpdateSnippetInput>) => Promise<void>
  deleteSnippet: (id: number) => Promise<void>
  toggleFavorite: (id: number) => Promise<void>
  reorderSnippets: (newOrderSnippetIds: number[]) => Promise<void>
}

// --- HOOK ---
export function useSnippets(
  viewMode: ViewMode,
  selectedCategoryId: number | null,
  searchQuery: string,
): UseSnippetsReturn {
  const [snippets, setSnippets] = useState<SnippetWithCategory[]>([])
  const [loading, setLoading] = useState(true)

  const fetchSnippets = useCallback(async () => {
    setLoading(true)
    try {
      const data = await window.api.getSnippets({})
      setSnippets(data)
    } catch (error) {
      console.error(error)
      toast.error('Failed to load snippets.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSnippets()
  }, [fetchSnippets])

  const filteredSnippets = useMemo(() => {
    let result = snippets

    // 1. Поиск
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (s) => s.title.toLowerCase().includes(q) || s.body.toLowerCase().includes(q)
      )
    }

    // 2. Фильтрация по режиму
    if (viewMode === 'favorites') {
      result = result.filter((s) => s.favorite)
    } else if (viewMode === 'category' && selectedCategoryId !== null) {
      result = result.filter((s) => s.categoryId === selectedCategoryId)
    }

    // (Для 'all' и 'trash' логика остается стандартной или обрабатывается отдельно)

    return result
  }, [snippets, viewMode, selectedCategoryId, searchQuery])

  // 3. CRUD Операции

  const createSnippet = async (data: CreateSnippetInput) => {
    try {
      await window.api.createSnippet(data)
      toast.success('Snippet utworzony.')
      await fetchSnippets()
    } catch (e) {
      toast.error('Błąd podczas tworzenia snippet')
    }
  }

  const updateSnippet = async (id: number, data: Partial<UpdateSnippetInput>) => {
    try {
      await window.api.updateSnippet({ id, ...data })
      toast.success('Snippet zaktualizowany.')
      await fetchSnippets()
    } catch (e) {
      toast.error('Błąd podczas aktualizacji snippet')
    }
  }

  const deleteSnippet = async (id: number) => {
    try {
      await window.api.deleteSnippet(id)
      toast.success('Snippet przeniesiony do kosza.')
      await fetchSnippets()
    } catch (e) {
      toast.error('Błąd podczas usuwania snippet')
    }
  }

  const toggleFavorite = async (id: number) => {
    const snippet = snippets.find((s) => s.id === id)
    if (!snippet) return

    try {
      // Оптимистичное обновление UI
      setSnippets((prev) => prev.map((s) => (s.id === id ? { ...s, favorite: !s.favorite } : s)))
      // Запрос в базу
      await window.api.updateSnippet({ id, favorite: !snippet.favorite })
    } catch (e) {
      toast.error('Bląd podczas aktualizacji ulubionych')
      // Откат при ошибке
      await fetchSnippets()
    }
  }

  const reorderSnippets = async (newOrderSnippetIds: number[]): Promise<void> => {

    const reorderedList = newOrderSnippetIds
      .map((id) => snippets.find((s) => s.id === id))
      .filter(Boolean) as SnippetWithCategory[] // убираем undefined
    setSnippets(reorderedList)

    try {
      const payload = newOrderSnippetIds.map((id, index) => ({
        id,
        order: index // Просто присваиваем порядковый номер 0, 1, 2...
      }))
      await window.api.reorderSnippets(payload)

      // 3. Тихо обновляем данные из базы, чтобы убедиться в синхронизации
      await fetchSnippets()
    } catch (e) {
      toast.error('Bląd podczas zmiany kolejności snippet')
      console.error(e)
      await fetchSnippets() // Откат в случае ошибки
    }
  }

  return {
    snippets,
    filteredSnippets,
    loading,
    refresh: fetchSnippets,
    createSnippet,
    updateSnippet,
    deleteSnippet,
    toggleFavorite,
    reorderSnippets
  }
}
