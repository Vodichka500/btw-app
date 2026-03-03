import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import { RecycleBinItem, RecycleBinItemType } from '@btw-app/shared'

export interface UseTrashReturn {
  items: RecycleBinItem[]
  loading: boolean
  fetchTrash: () => Promise<void>
  restore: (type: RecycleBinItemType, id: number) => Promise<boolean>
  hardDelete: (type: RecycleBinItemType, id: number) => Promise<void>
  emptyTrash: () => Promise<void>
}

export function useTrash(): UseTrashReturn{
  const [items, setItems] = useState<RecycleBinItem[]>([])
  const [loading, setLoading] = useState(false)

  // Загрузка и объединение данных
  const fetchTrash = useCallback(async () => {
    setLoading(true)
    try {
      const { categories: trashCats, snippets: trashSnips } = await window.api.getTrash()

      // Преобразуем всё в единый формат RecycleBinItem
      const unifiedItems: RecycleBinItem[] = [
        ...trashCats.map((c) => ({
          id: c.id,
          type: 'category' as const,
          name: c.name,
          deletedAt: new Date(c.deletedAt!) // Drizzle может вернуть строку или Date, лучше обернуть
        })),
        ...trashSnips.map((s) => ({
          id: s.id,
          type: 'snippet' as const,
          name: s.title,
          deletedAt: new Date(s.deletedAt!)
        }))
      ].sort((a, b) => b.deletedAt.getTime() - a.deletedAt.getTime()) // Сортировка: новые сверху

      setItems(unifiedItems)
    } catch (error) {
      console.error(error)
      toast.error('Blad podczas ładowania kosza.')
    } finally {
      setLoading(false)
    }
  }, [])

  // Восстановление
  const restore = async (type: RecycleBinItemType, id: number) => {
    try {
      await window.api.restoreItem(type, id)
      toast.success('Pozycja przywrócona')
      await fetchTrash() // Обновляем корзину
      return true // Возвращаем успех, чтобы App.tsx мог обновить остальные списки
    } catch (e) {
      toast.error('Blad podczas przywracania pozycji')
      return false
    }
  }

  // Удаление навсегда
  const hardDelete = async (type: RecycleBinItemType, id: number) => {
    try {
      await window.api.hardDeleteItem(type, id)
      toast.success('Pozycja trwale usunięta')
      await fetchTrash()
    } catch (e) {
      toast.error('Blad podczas trwalego usuwania pozycji')
    }
  }

  // Очистить всё
  const emptyTrash = async () => {
    try {
      await window.api.emptyTrash()
      toast.success('Kosz opróżniony')
      setItems([]) // Можно просто очистить стейт, не делая запрос
    } catch (e) {
      toast.error('Blad podczas opróżniania kosza')
    }
  }

  return {
    items,
    loading,
    fetchTrash, // Нужно вызывать в useEffect при открытии вкладки Trash
    restore,
    hardDelete,
    emptyTrash
  }
}
