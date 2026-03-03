'use client'

import { ReactNode } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { SnippetCard } from './snippet/snippet-card'
import type { SnippetWithCategory } from '@btw-app/shared'
import { cn } from '@/lib/utils'

interface SortableSnippetCardProps {
  snippet: SnippetWithCategory
  onToggleFavorite: (id: number) => Promise<void>
  onEdit: (snippet: SnippetWithCategory) => void
  onDelete: (id: number) => Promise<void>
  isReordering: boolean
}

export function SortableSnippetCard({
  snippet,
  onToggleFavorite,
  onEdit,
  onDelete,
  isReordering
}: SortableSnippetCardProps): ReactNode {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: snippet.id,
    disabled: !isReordering
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      // Применяем listeners (события мыши) только если включен режим перетаскивания
      {...attributes}
      {...(isReordering ? listeners : {})}
      className={cn(
        'relative touch-none', // touch-none важен для мобильных
        isDragging && 'z-50 opacity-50', // Стиль элемента, который летит
        isReordering &&
          'cursor-grab active:cursor-grabbing hover:ring-2 hover:ring-primary/50 rounded-2xl' // Стиль в режиме редактирования
      )}
    >
      {/* Блокируем клики внутри карточки (копирование, редактирование) во время режима сортировки,
         чтобы случайно не скопировать текст пока перетаскиваешь
      */}
      <div className={cn(isReordering && 'pointer-events-none')}>
        <SnippetCard
          snippet={snippet}
          onToggleFavorite={onToggleFavorite}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      </div>
    </div>
  )
}
