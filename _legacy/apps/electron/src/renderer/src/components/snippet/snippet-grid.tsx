'use client'

import React, { useState } from 'react'
import { Search, Plus, FileText, Folder, ChevronRight, ArrowUpDown, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import type { SnippetWithCategory } from '@btw-app/shared'
import { ViewMode } from '@btw-app/shared'
import { CategoryWithChildren } from '@btw-app/shared'
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
import { SortableSnippetCard } from '@/components/sortable-snippet-card'


interface SnippetGridProps {
  snippets: SnippetWithCategory[]
  loading: boolean
  searchQuery: string
  viewMode: ViewMode
  categoryName?: string
  // Синхронные хендлеры UI
  onSearchChange: (q: string) => void
  onCreateSnippet: () => void
  onEditSnippet: (snippet: SnippetWithCategory) => void
  // Асинхронные хендлеры БД
  onToggleFavorite: (id: number) => Promise<void>
  onDeleteSnippet: (id: number) => Promise<void>
  subCategories?: CategoryWithChildren[] // Новые пропсы
  onCategoryClick?: (id: number) => void // Хендлер клика по папке
  onReorderSnippets?: (ids: number[]) => void
}

function getViewTitle(viewMode: ViewMode, categoryName?: string): string {
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

export function SnippetGrid({
  snippets,
  loading,
  searchQuery,
  viewMode,
  categoryName,
  onSearchChange,
  onCreateSnippet,
  onToggleFavorite,
  onEditSnippet,
  onDeleteSnippet,
  subCategories,
  onCategoryClick,
  onReorderSnippets
}: SnippetGridProps): React.ReactNode {

  const [isReordering, setIsReordering] = useState(false)

  // Настройка сенсоров (чтобы драг не срабатывал от случайного клика)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8 // Начать драг только если сдвинули мышь на 8px
      }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  )

  const handleDragEnd = (event: DragEndEvent): void => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      // Находим старый и новый индексы
      const oldIndex = snippets.findIndex((s) => s.id === active.id)
      const newIndex = snippets.findIndex((s) => s.id === over.id)

      // Вычисляем новый порядок локально (виртуально)
      const newOrderArray = arrayMove(snippets, oldIndex, newIndex)
      const newOrderIds = newOrderArray.map((s) => s.id)

      // Отправляем наверх в App для обработки
      if (onReorderSnippets) {
        onReorderSnippets(newOrderIds)
      }
    }
  }
  // Фильтрация сниппетов (если поиск на клиенте)
  const filteredSnippets = snippets.filter((s) => {
    const q = searchQuery.toLowerCase()
    return s.title.toLowerCase().includes(q) || s.body.toLowerCase().includes(q)
  })

  // Фильтрация папок (тоже ищем по имени)
  const filteredSubCategories = subCategories
    ? subCategories.filter((c) => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : []

  const hasItems = filteredSnippets.length > 0 || filteredSubCategories.length > 0

  const canReorder =
    !searchQuery && snippets.length > 1 && viewMode !== 'trash'

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-background/50 h-screen overflow-hidden">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-8 py-6 shrink-0 z-10 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 border-b border-border/40">
        <div>
          <h2 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
            {viewMode === 'category' && <Folder className="h-6 w-6 text-muted-foreground/50" />}
            {getViewTitle(viewMode, categoryName)}
          </h2>
          <p className="text-sm font-medium text-muted-foreground mt-1">
            {loading ? (
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
                onChange={(e) => onSearchChange(e.target.value)}
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
              onClick={onCreateSnippet}
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
        {loading ? (
          // Скелетоны
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-40 rounded-2xl" />
            ))}
          </div>
        ) : !hasItems ? (
          // Пустое состояние
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
                onClick={onCreateSnippet}
                variant="outline"
                className="gap-2 rounded-xl border-dashed h-12 px-6"
              >
                <Plus className="h-4 w-4" />
                Utwórz snippet
              </Button>
            )}
          </div>
        ) : (
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
                          onToggleFavorite={onToggleFavorite}
                          onEdit={onEditSnippet}
                          onDelete={onDeleteSnippet}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              </div>
            )}

            {/* 📁 Folders Section (только если есть папки) */}
            {filteredSubCategories.length > 0 && !isReordering && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1">
                  Foldery
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                  {filteredSubCategories.map((cat) => (
                    <div
                      key={cat.id}
                      onClick={() => onCategoryClick?.(cat.id)}
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
        )}
      </div>
    </div>
  )
}
