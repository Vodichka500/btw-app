import { create } from 'zustand'
import { ViewMode } from '@btw-app/shared'

interface UIState {
  viewMode: ViewMode
  selectedCategoryId: number | null
  isCollapsed: boolean
  setViewMode: (mode: ViewMode, categoryId?: number) => void
  toggleNotes: () => void
  toggleCollapse: () => void
  setSelectedCategoryId: (id: number | null) => void
}

export const useUIStore = create<UIState>((set) => ({
  viewMode: 'all',
  selectedCategoryId: null,
  isCollapsed: false,

  setViewMode: (mode, categoryId = undefined) => set({ viewMode: mode, selectedCategoryId: categoryId }),

  toggleNotes: () =>
    set((state) => ({
      viewMode: state.viewMode === 'notes' ? 'all' : 'notes'
    })),

  toggleCollapse: () =>
    set((state) => ({
      isCollapsed: !state.isCollapsed
    })),

  setSelectedCategoryId: (id) => set({ selectedCategoryId: id })
}))
