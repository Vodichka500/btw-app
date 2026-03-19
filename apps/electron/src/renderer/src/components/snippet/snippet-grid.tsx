'use client'

import React, { useState } from 'react'
import { Search, Plus, FileText, Folder, ChevronRight, ArrowUpDown, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors
} from '@dnd-kit/core'
import {
  arrayMove,
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates
} from '@dnd-kit/sortable'

// 🔥 Импорты типов и хуков
import type { CategoryNode, SnippetNode } from '@/lib/trpc'
import { useUIStore } from '@/store/uiStore'
import { useNavigation } from '@/hooks/use-navigation'
import { useSnippets } from '@/hooks/use-snippets'
import { useCategories } from '@/hooks/use-categories'
import { AsyncView } from '@/components/async-view'
import { SortableSnippetCard } from '@/components/snippet/sortable-snippet-card'

// 🔥 Пропсов стало минимум! Всё остальное компонент берет сам.
interface SnippetGridProps {
  onCreateSnippet: () => void
  onEditSnippet: (snippet: SnippetNode) => void
}

// Хелпер для поиска имени категории
function findCategoryName(cats: CategoryNode[], id: number): string {
  const flat: CategoryNode[] = []
  const flatten = (nodes: CategoryNode[]) => {
    for (const n of nodes) {
      flat.push(n)
      if (n.children) flatten(n.children)
    }
  }
  flatten(cats)
  return flat.find((c) => c.id === id)?.name || 'Kategoria'
}

function getViewTitle(viewMode: string, categoryName?: string): string {
  switch (viewMode) {
    case 'all':
      return 'Wszystkie snippety'
    case 'favorites':
      return 'Ulubione'
    case 'category':
      return categoryName || 'Kategoria'
    case 'trash':
      return 'Kosz'
    default:
      return 'Snippety'
  }
}

export function SnippetGrid({ onCreateSnippet, onEditSnippet }: SnippetGridProps): React.ReactNode {
  const [isReordering, setIsReordering] = useState(false)

  // Достаем глобальный стейт
  const { viewMode, selectedCategoryId } = useUIStore()
  const { searchQuery, setSearchQuery, handleViewChange } = useNavigation()

  // Достаем данные tRPC
  const {
    query: snipsQuery,
    filteredSnippets,
    toggleFavorite,
    deleteSnippet,
    reorderSnippets
  } = useSnippets(viewMode, selectedCategoryId, searchQuery)

  const { categories, getSubcategories } = useCategories()

  // Вычисляем данные для UI
  const subCategories = viewMode === 'category' ? getSubcategories(selectedCategoryId) : []
  const categoryName = selectedCategoryId
    ? findCategoryName(categories, selectedCategoryId)
    : undefined

  // Настройка сенсоров
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragEnd = (event: DragEndEvent): void => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIndex = filteredSnippets.findIndex((s) => s.id === active.id)
      const newIndex = filteredSnippets.findIndex((s) => s.id === over.id)
      const newOrderArray = arrayMove(filteredSnippets, oldIndex, newIndex)

      reorderSnippets(newOrderArray.map((s) => s.id))
    }
  }

  const filteredSubCategories = subCategories.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const hasItems = filteredSnippets.length > 0 || filteredSubCategories.length > 0
  const canReorder = !searchQuery && filteredSnippets.length > 1 && viewMode !== 'trash'

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-background/50 h-screen overflow-hidden">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-8 py-6 shrink-0 z-10 bg-background/95 backdrop-blur border-b border-border/40">
        <div>
          <h2 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
            {viewMode === 'category' && <Folder className="h-6 w-6 text-muted-foreground/50" />}
            {getViewTitle(viewMode, categoryName)}
          </h2>
          <p className="text-sm font-medium text-muted-foreground mt-1">
            {snipsQuery.isLoading ? (
              'Ładowanie...'
            ) : (
              <>
                {filteredSubCategories.length > 0 && `${filteredSubCategories.length} foldery, `}
                {filteredSnippets.length} snippety
              </>
            )}
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {!isReordering && (
            <div className="relative w-full sm:w-auto animate-in fade-in zoom-in-95">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                type="text"
                placeholder="Szukaj..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)} // 🔥 Используем setSearchQuery
                className="pl-9 h-10 w-full sm:w-64 rounded-xl bg-card/50 shadow-sm border-border/60 focus:bg-background transition-all"
              />
            </div>
          )}
          {canReorder && (
            <Button
              variant={isReordering ? 'default' : 'outline'}
              onClick={() => setIsReordering(!isReordering)}
              className="gap-2 rounded-xl h-10 px-4"
            >
              {isReordering ? (
                <>
                  <Check className="h-4 w-4" />
                  <span>Gotowe</span>
                </>
              ) : (
                <>
                  <ArrowUpDown className="h-4 w-4" />
                  <span className="hidden lg:inline">Zmień kolejność</span>
                </>
              )}
            </Button>
          )}
          {!isReordering && (
            <Button
              onClick={onCreateSnippet} // 🔥 Вернули onCreateSnippet
              className="gap-2 rounded-xl h-10 px-4 font-semibold animate-in fade-in zoom-in-95"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden lg:inline">Utwórz</span>
            </Button>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-8 scroll-smooth">
        <AsyncView
          query={snipsQuery}
          isEmpty={!hasItems}
          loader={
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-40 rounded-2xl" />
              ))}
            </div>
          }
          emptyFallback={
            <div className="flex flex-col items-center justify-center h-[60vh] text-center opacity-80">
              <div className="flex items-center justify-center h-20 w-20 rounded-3xl bg-secondary/50 mb-6">
                <FileText className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Tu jest pusto</h3>
              <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                {searchQuery
                  ? `Brak wyników dla "${searchQuery}"`
                  : 'Utwórz snippet lub podkategorię.'}
              </p>
              {!searchQuery && (
                <Button
                  onClick={onCreateSnippet} // 🔥 Вернули onCreateSnippet
                  variant="outline"
                  className="gap-2 rounded-xl border-dashed h-12 px-6"
                >
                  <Plus className="h-4 w-4" /> Utwórz snippet
                </Button>
              )}
            </div>
          }
        >
          <div className="flex flex-col gap-10 pb-10">
            {/* 📄 Snippets Section */}
            {filteredSnippets.length > 0 && (
              <div className="space-y-4">
                {filteredSubCategories.length > 0 && !isReordering && (
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1">
                    Snippety
                  </h3>
                )}
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={filteredSnippets.map((s) => s.id)}
                    strategy={rectSortingStrategy}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                      {filteredSnippets.map((snippet) => (
                        <SortableSnippetCard
                          key={snippet.id}
                          snippet={snippet}
                          isReordering={isReordering}
                          onToggleFavorite={toggleFavorite}
                          onEdit={onEditSnippet}
                          onDelete={deleteSnippet}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              </div>
            )}

            {/* 📁 Folders Section */}
            {filteredSubCategories.length > 0 && !isReordering && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1">
                  Foldery
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                  {filteredSubCategories.map((cat) => (
                    <div
                      key={cat.id}
                      onClick={() => handleViewChange('category', cat.id)}
                      className="group flex items-center gap-4 p-4 bg-card hover:bg-accent/40 border border-border/40 hover:border-primary/40 rounded-xl cursor-pointer transition-all duration-200"
                    >
                      <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-amber-400/10 group-hover:bg-amber-400/20 transition-colors">
                        <Folder className="h-6 w-6 text-amber-500 group-hover:scale-110 transition-transform" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-card-foreground truncate">{cat.name}</p>
                        <p className="text-xs text-muted-foreground">Kategoria</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </AsyncView>
      </div>
    </div>
  )
}
