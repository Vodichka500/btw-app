import { useState } from 'react'
import { ViewMode } from '@btw-app/shared'
import { useUIStore } from '@/store/uiStore'

export interface UseNavigationReturn {
  searchQuery: string
  setSearchQuery: (query: string) => void
  handleViewChange: (mode: ViewMode, categoryId?: number) => void
  isNotesFloating: boolean
  toggleNotesMode: () => void
  closeNotes: () => void
  openNotesFull: () => void
}

export function useNavigation(): UseNavigationReturn {
  const { viewMode, setViewMode, setSelectedCategoryId } = useUIStore()
  const [searchQuery, setSearchQuery] = useState('')

  // Логика заметок
  const [lastViewMode, setLastViewMode] = useState<ViewMode>('all')
  const [isNotesFloating, setIsNotesFloating] = useState(false)

  const handleViewChange = (mode: ViewMode, categoryId?: number) => {
    if (mode === 'notes') {
      if (viewMode !== 'notes') setLastViewMode(viewMode)
      setIsNotesFloating(false)
    } else if (viewMode === 'notes') {
      setIsNotesFloating(true)
    }

    setViewMode(mode)
    if (mode !== 'category') setSelectedCategoryId(null)
    if (categoryId) setSelectedCategoryId(categoryId)
    setSearchQuery('')
  }

  const toggleNotesMode = () => {
    if (viewMode === 'notes') {
      setViewMode(lastViewMode)
      setIsNotesFloating(true)
    } else {
      setLastViewMode(viewMode)
      setViewMode('notes')
      setIsNotesFloating(false)
    }
  }

  const closeNotes = () => {
    setIsNotesFloating(false)
    if (viewMode === 'notes') {
      setViewMode(lastViewMode)
    }
  }

  return {
    searchQuery,
    setSearchQuery,
    handleViewChange,
    isNotesFloating,
    toggleNotesMode,
    closeNotes,
    openNotesFull: () => handleViewChange('notes')
  }
}
