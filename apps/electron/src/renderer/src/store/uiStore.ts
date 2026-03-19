import { create } from 'zustand'
import { ViewMode } from '@btw-app/shared'

interface UIState {
  viewMode: ViewMode
  lastViewMode: ViewMode
  selectedCategoryId: number | null
  isCollapsed: boolean
  isNotesFloating: boolean
  isTeachersOpen: boolean
  isCategoryOpen: boolean

  setViewMode: (mode: ViewMode, categoryId?: number) => void
  toggleNotes: () => void
  toggleCollapse: () => void
  setSelectedCategoryId: (id: number | null) => void
  toggleNotesMode: () => void
  closeNotes: () => void
  setTeachersOpen: (isOpen: boolean) => void
  setCategoryOpen: (isOpen: boolean) => void
}

export const useUIStore = create<UIState>((set) => ({
  viewMode: 'all',
  lastViewMode: 'all',
  selectedCategoryId: null,
  isCollapsed: false,
  isNotesFloating: false,
  isTeachersOpen: false,
  isCategoryOpen: true,

  setViewMode: (mode, categoryId = undefined) =>
    set({ viewMode: mode, selectedCategoryId: categoryId }),

  toggleNotes: () =>
    set((state) => ({
      viewMode: state.viewMode === 'notes' ? 'all' : 'notes'
    })),

  toggleCollapse: () =>
    set((state) => ({
      isCollapsed: !state.isCollapsed
    })),

  setSelectedCategoryId: (id) => set({ selectedCategoryId: id }),

  toggleNotesMode: () =>
    set((state) => {
      if (state.viewMode === 'notes') {
        // Из фуллскрина в плавающее окно
        return { viewMode: state.lastViewMode, isNotesFloating: true }
      } else {
        // Из плавающего в фуллскрин
        return { lastViewMode: state.viewMode, viewMode: 'notes', isNotesFloating: false }
      }
    }),

  closeNotes: () =>
    set((state) => ({
      isNotesFloating: false,
      // Если закрыли в фуллскрине — возвращаемся назад
      viewMode: state.viewMode === 'notes' ? state.lastViewMode : state.viewMode
    })),

  setTeachersOpen: (isOpen) => set({ isTeachersOpen: isOpen }),
  setCategoryOpen: (isOpen) => set({ isCategoryOpen: isOpen })
}))
