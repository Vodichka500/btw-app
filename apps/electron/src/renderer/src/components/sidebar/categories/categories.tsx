'use client'

import { useState } from 'react' // Добавил React для типизации и консистенции
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
import { ChevronDown, ChevronUp, Folder, FolderPlus, Plus } from 'lucide-react'

import { useSidebar } from '@/hooks/use-sidebar'
import { SortableCategoryItem } from './category-item'
import { useUIStore } from '@/store/uiStore'
import { useCategories } from '@/hooks/use-categories'
import { CategoryModal } from '@/components/category-modal'
import { AsyncView } from '@/components/async-view'
import { CategoryNode } from '@/lib/trpc'
import { DeleteCategoryModal } from '@/components/sidebar/categories/delete-category-modal'

function flattenCategories(cats: CategoryNode[]): CategoryNode[] {
  const result: CategoryNode[] = []
  for (const cat of cats) {
    result.push(cat)
    if (cat.children && cat.children.length > 0) {
      result.push(...flattenCategories(cat.children))
    }
  }
  return result
}


export default function Categories() {
  // Модалка создания/редактирования
  const [catModal, setCatModal] = useState<{
    open: boolean
    edit: CategoryNode | null
    parentId: number | null
  }>({ open: false, edit: null, parentId: null })

  // 🔥 Модалка подтверждения удаления
  const [deleteModal, setDeleteModal] = useState<{
    open: boolean
    categoryId: number | null
    categoryName: string
  }>({ open: false, categoryId: null, categoryName: '' })

  const {
    viewMode,
    selectedCategoryId,
    isCollapsed,
    toggleCollapse,
    setViewMode,
    isCategoryOpen,
    setCategoryOpen
  } = useUIStore()

  const {
    query,
    categories,
    createCategory,
    deleteCategory, // Эта функция теперь принимает (id, withSnippets)
    updateCategory,
    updateCategoryStructure
  } = useCategories()

  const { items, sensors, handleCollapse, handleDragStart, handleDragEnd, activeId } = useSidebar(
    categories,
    updateCategoryStructure
  )

  const activeItem = activeId ? items.find((i) => i.id === activeId) : null

  const handleSaveCategory = async (name: string, parentId: number | null) => {
    if (catModal.edit) {
      await updateCategory(catModal.edit.id, name)
    } else {
      await createCategory(name, parentId ?? undefined)
    }
    setCatModal({ open: false, edit: null, parentId: null })
  }

  // 🔥 Теперь эта функция не удаляет сразу, а подготавливает данные для модалки
  const handleDeleteCategory = (id: number) => {
    const categoryItem = items.find(i => i.id === id)
    if (categoryItem) {
      setDeleteModal({
        open: true,
        categoryId: id,
        categoryName: categoryItem.name
      })
    }
  }

  // 🔥 Вызывается при подтверждении в DeleteCategoryModal
  const handleConfirmDelete = async (withSnippets: boolean) => {
    if (deleteModal.categoryId) {
      // Вызываем мутацию с выбранным пользователем режимом
      await deleteCategory(deleteModal.categoryId, withSnippets)

      setDeleteModal(prev => ({ ...prev, open: false }))

      // Если удалили категорию, в которой находились — уходим в корень
      if (selectedCategoryId === deleteModal.categoryId) {
        setViewMode('all')
      }
    }
  }

  const handleOpenCreateCat = () => setCatModal({ open: true, edit: null, parentId: null })
  const handleOpenEditCat = (c: CategoryNode) =>
    setCatModal({ open: true, edit: c, parentId: null })
  const handleOpenSubCat = (pid: number) => setCatModal({ open: true, edit: null, parentId: pid })

  const dropAnimation: DropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.4' } } })
  }

  return (
    <>
      {!isCollapsed ? (
        <Collapsible
          open={isCategoryOpen}
          onOpenChange={setCategoryOpen}
          className="flex flex-col flex-1 min-h-0 pt-4"
        >
          <CollapsibleTrigger asChild>
            <div className="px-6 mb-2 flex items-center justify-between group shrink-0 cursor-pointer text-sidebar-foreground/60 hover:text-sidebar-foreground">
              <p className="text-xs font-semibold uppercase tracking-wider transition-colors">
                Kategorie
              </p>
              <button className="p-1 rounded transition-colors hover:bg-sidebar-accent">
                {isCategoryOpen ? (
                  <ChevronUp className="h-3.5 w-3.5" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
          </CollapsibleTrigger>

          <CollapsibleContent className="flex-1 min-h-0 overflow-hidden flex flex-col data-[state=closed]:hidden">
            <AsyncView
              query={query}
              isEmpty={categories.length === 0}
              emptyFallback={
                <div className="flex flex-col items-center justify-center py-8 text-center px-4 opacity-50">
                  <FolderPlus className="h-8 w-8 mb-2" />
                  <p className="text-xs">Brak kategorii</p>
                </div>
              }
            >
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
                      onDelete={handleDeleteCategory} // Передаем наш новый хендлер
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
            </AsyncView>
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

      <DeleteCategoryModal
        open={deleteModal.open}
        categoryName={deleteModal.categoryName}
        onClose={() => setDeleteModal((prev) => ({ ...prev, open: false }))}
        onConfirm={handleConfirmDelete}
      />
    </>
  )
}
