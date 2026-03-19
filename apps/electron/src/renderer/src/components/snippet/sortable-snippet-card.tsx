'use client'

import { ReactNode } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { SnippetCard } from '@/components/snippet/snippet-card'
import { cn } from '@/lib/utils'

import { DeletedSnippet, SnippetNode } from '@/lib/trpc'

interface SortableSnippetCardProps {
  snippet: SnippetNode
  onToggleFavorite: (id: number) => Promise<void>
  onEdit: (snippet: SnippetNode) => void
  onDelete: (id: number) => Promise<DeletedSnippet>
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
      {...attributes}
      {...(isReordering ? listeners : {})}
      className={cn(
        'relative touch-none',
        isDragging && 'z-50 opacity-50',
        isReordering &&
          'cursor-grab active:cursor-grabbing hover:ring-2 hover:ring-primary/50 rounded-2xl'
      )}
    >
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
