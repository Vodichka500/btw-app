'use client'

import { useState } from 'react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Button } from '@/components/ui/button'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import {
  DndContext,
  closestCenter,
  DragOverlay,
  MeasuringStrategy,
  DropAnimation,
  defaultDropAnimationSideEffects
} from '@dnd-kit/core'
import { ChevronDown, ChevronUp, Folder, FolderPlus, Loader2, Plus } from 'lucide-react'

import { useSidebar } from '@/hooks/use-sidebar'
import type { CategoryWithChildren } from '@btw-app/shared'
import { SortableCategoryItem } from '@/components/sidebar/categories/category-item'
import { useUIStore } from '@/store/uiStore'
import { useCategories } from '@/hooks/use-categories'
import { useSnippets } from '@/hooks/use-snippets' // Нужен для обновления при удалении категории
import { CategoryModal } from '@/components/category-modal'

// Хелпер для модалки
function flattenCategories(cats: CategoryWithChildren[]): CategoryWithChildren[] {
  const result: CategoryWithChildren[] = []
  for (const cat of cats) {
    result.push(cat)
    if (cat.children && cat.children.length > 0) {
      result.push(...flattenCategories(cat.children))
    }
  }
  return result
}

interface CategoriesProps {
  categoryOpen: boolean
  setCategoryOpen: (open: boolean) => void
}

export default function Categories({ categoryOpen, setCategoryOpen }: CategoriesProps) {
  const [catModal, setCatModal] = useState<{
    open: boolean
    edit: CategoryWithChildren | null
    parentId: number | null
  }>({ open: false, edit: null, parentId: null })

  // 1. Стейт UI
  const { viewMode, selectedCategoryId, isCollapsed, toggleCollapse, setViewMode } = useUIStore()

  // 2. Данные категорий
  const {
    categories,
    createCategory,
    deleteCategory,
    updateCategory,
    updateCategoryStructure,
    loading: isCategoryLoading
  } = useCategories()

  // Нужен для рефреша после удаления категории
  const snips = useSnippets(viewMode, selectedCategoryId, '')

  // 3. Данные DND и Сайдбара
  const { items, sensors, handleCollapse, handleDragStart, handleDragEnd, activeId } = useSidebar(
    categories,
    updateCategoryStructure
  )

  const activeItem = activeId ? items.find((i) => i.id === activeId) : null

  // --- Хендлеры ---
  const handleSaveCategory = async (name: string, parentId: number | null) => {
    if (catModal.edit) {
      await updateCategory(catModal.edit.id, name)
    } else {
      await createCategory(name, parentId ?? undefined)
    }
    setCatModal({ open: false, edit: null, parentId: null })
  }

  const handleDeleteCategory = async (id: number) => {
    const success = await deleteCategory(id)
    if (success) {
      await snips.refresh()
      if (selectedCategoryId === id) setViewMode('all')
    }
  }

  const handleOpenCreateCat = () => setCatModal({ open: true, edit: null, parentId: null })

  // Эти функции можно передавать в SortableCategoryItem
  const handleOpenEditCat = (c: CategoryWithChildren) =>
    setCatModal({ open: true, edit: c, parentId: null })
  const handleOpenSubCat = (pid: number) => setCatModal({ open: true, edit: null, parentId: pid })

  const dropAnimation: DropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.4' } } })
  }

  return (
    <>
      {!isCollapsed ? (
        <Collapsible
          open={categoryOpen}
          onOpenChange={setCategoryOpen}
          className="flex flex-col flex-1 min-h-0 pt-4"
        >
          <CollapsibleTrigger asChild>
            <div className="px-6 mb-2 flex items-center justify-between group shrink-0 cursor-pointer text-sidebar-foreground/60 hover:text-sidebar-foreground">
              <p className="text-xs font-semibold uppercase tracking-wider transition-colors">
                Kategorie
              </p>
              <button className="p-1 rounded transition-colors hover:bg-sidebar-accent">
                {categoryOpen ? (
                  <ChevronUp className="h-3.5 w-3.5" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
          </CollapsibleTrigger>

          <CollapsibleContent className="flex-1 min-h-0 overflow-hidden flex flex-col data-[state=closed]:hidden">
            {isCategoryLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-sidebar-foreground/40" />
              </div>
            ) : categories.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center px-4 opacity-50">
                <FolderPlus className="h-8 w-8 mb-2" />
                <p className="text-xs">Brak kategorii</p>
              </div>
            ) : (
              <>
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                  measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
                >
                  <SortableContext
                    items={items.map((i) => i.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {items.map((item) => (
                      <SortableCategoryItem
                        key={item.id}
                        item={item}
                        selectedCategoryId={selectedCategoryId}
                        viewMode={viewMode}
                        onCollapse={handleCollapse}
                        onSelect={(id) => setViewMode('category', id)}
                        onEdit={handleOpenEditCat}
                        onAddSub={handleOpenSubCat}
                        onDelete={handleDeleteCategory}
                      />
                    ))}
                  </SortableContext>
                  <DragOverlay dropAnimation={dropAnimation}>
                    {activeItem ? (
                      <SortableCategoryItem
                        item={activeItem}
                        selectedCategoryId={selectedCategoryId}
                        viewMode={viewMode}
                        onCollapse={() => {}}
                        onSelect={() => {}}
                        onEdit={() => {}}
                        onAddSub={() => {}}
                        onDelete={() => {}}
                        style={{ backgroundColor: 'var(--sidebar-accent)' }}
                      />
                    ) : null}
                  </DragOverlay>
                </DndContext>
                <Button
                  variant="ghost"
                  className="w-full justify-start mt-2 gap-2 text-sidebar-foreground/70 hover:text-sidebar-foreground"
                  onClick={handleOpenCreateCat}
                >
                  <Plus className="h-4 w-4" /> Nowa kategoria
                </Button>
              </>
            )}
          </CollapsibleContent>
        </Collapsible>
      ) : (
        <div className="flex justify-center items-center p-2">
          <Button variant="ghost" onClick={toggleCollapse}>
            <Folder className="h-4 w-4" />
          </Button>
        </div>
      )}

      <CategoryModal
        open={catModal.open}
        onClose={() => setCatModal({ ...catModal, open: false })}
        onSave={handleSaveCategory}
        editCategory={catModal.edit}
        parentId={catModal.parentId}
        flatCategories={flattenCategories(categories)}
      />
    </>
  )
}
