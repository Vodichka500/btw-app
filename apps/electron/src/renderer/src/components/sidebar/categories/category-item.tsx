'use client'

import React from 'react'
import {
  ChevronRight,
  Folder,
  FolderOpen,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2
} from 'lucide-react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { CategoryWithChildren, ViewMode } from '@btw-app/shared' // Исправил пути импорта для чистоты

// Тип для плоского элемента
export interface FlatCategoryItem {
  id: number
  name: string
  parentId: number | null
  depth: number
  index: number
  isExpanded: boolean
  hasChildren: boolean
  data: CategoryWithChildren
}

const INDENT_WIDTH = 20

interface SortableItemProps {
  item: FlatCategoryItem
  selectedCategoryId: number | null
  viewMode: ViewMode
  onCollapse: (id: number) => void
  onSelect: (id: number) => void
  onEdit: (cat: CategoryWithChildren) => void
  onAddSub: (id: number) => void
  onDelete: (id: number) => void
  style?: React.CSSProperties
}

export function SortableCategoryItem({
  item,
  selectedCategoryId,
  viewMode,
  onCollapse,
  onSelect,
  onEdit,
  onAddSub,
  onDelete,
  style
}: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    data: item
  })

  const isSelected = viewMode === 'category' && selectedCategoryId === item.id

  const composedStyle: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
    paddingLeft: `${item.depth * INDENT_WIDTH + 8}px`, // Немного уменьшил базовый отступ для совпадения с Schedule
    ...style
  }

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={composedStyle}
        className="opacity-40 bg-sidebar-accent rounded-md h-8 mb-1 border-2 border-sidebar-primary/30 border-dashed w-full" // Изменил rounded-xl на rounded-md
      />
    )
  }

  return (
    <div
      ref={setNodeRef}
      style={composedStyle}
      {...attributes}
      {...listeners}
      // Обертка: убрали padding-right, поменяли rounded-xl на rounded (как в Schedule)
      className={cn(
        'group flex items-center justify-between py-1 text-sm cursor-pointer transition-colors mb-0.5 outline-none select-none rounded',
        'w-full max-w-full',
        isSelected
          ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
          : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
      )}
      onClick={() => onSelect(item.id)}
    >
      {/* Левая часть: Кнопка раскрытия + Иконка + Текст (растягивается) */}
      <div className="flex items-center gap-2 flex-1 overflow-hidden px-2">
        <button
          type="button"
          // Делаем невидимой, если нет детей, но оставляем место, чтобы папки не прыгали
          className={cn(
            'shrink-0 flex items-center justify-center h-4 w-4 rounded-sm transition-colors hover:bg-sidebar-accent/80 z-10',
            !item.hasChildren && 'invisible'
          )}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation()
            onCollapse(item.id)
          }}
        >
          {/* Используем один ChevronRight и крутим его через CSS (как в Schedule) */}
          <ChevronRight
            className={cn(
              'h-3 w-3 shrink-0 text-sidebar-foreground/50 transition-transform duration-200',
              item.isExpanded && 'rotate-90'
            )}
          />
        </button>

        {/* Иконка папки */}
        {isSelected ? (
          <FolderOpen className="h-3.5 w-3.5 text-blue-400 shrink-0" />
        ) : (
          <Folder className="h-3.5 w-3.5 text-blue-400 shrink-0" /> // Синяя папка как в Schedule
        )}

        {/* Название категории */}
        <span className="truncate" title={item.name}>
          {item.name}
        </span>
      </div>

      {/* Правая часть: Дропдаун с троеточием */}
      <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity px-1">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="h-5 w-5 flex items-center justify-center rounded-md hover:bg-sidebar-accent hover:text-sidebar-foreground text-sidebar-foreground/60"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="h-3 w-3" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48 rounded-xl z-50">
            <DropdownMenuItem onClick={() => onEdit(item.data)}>
              <Pencil className="h-4 w-4 mr-2" /> Edytuj
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onAddSub(item.id)}>
              <Plus className="h-4 w-4 mr-2" />
              Dodaj podkategorię
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete(item.id)}
              className="text-destructive focus:text-destructive focus:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4 mr-2" /> Usuń
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
