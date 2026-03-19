import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import {
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
  DragStartEvent,
  DragEndEvent
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates, arrayMove } from '@dnd-kit/sortable'
import { FlatCategoryItem } from '@/components/sidebar/categories/category-item'
import { CategoryNode } from '@/lib/trpc'
import { ChangeOrderCategoryInput } from '@btw-app/shared'

const MIN_WIDTH = 240
const MAX_WIDTH = 600
const INDENT_WIDTH = 20

// Helper: Flatten Tree (с защитой от undefined)
function flattenTree(
  items: CategoryNode[],
  expandedIds: Set<number>,
  depth = 0,
  parentId: number | null = null
): FlatCategoryItem[] {
  if (!items || !Array.isArray(items)) return []

  const flat: FlatCategoryItem[] = []
  const sorted = [...items].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))

  for (const item of sorted) {
    const isExpanded = expandedIds.has(item.id)
    const hasChildren = !!item.children && item.children.length > 0

    flat.push({
      id: item.id,
      name: item.name,
      parentId,
      depth,
      index: 0,
      isExpanded,
      hasChildren,
      data: item
    })

    if (isExpanded && hasChildren) {
      flat.push(...flattenTree(item.children!, expandedIds, depth + 1, item.id))
    }
  }
  return flat
}

// 🔥 Добавили значения по умолчанию: categories = [], onReorderCategories = () => {}
export function useSidebar(
  categories: CategoryNode[] = [],
  onReorderCategories: (updates: ChangeOrderCategoryInput[]) => void = () => {}
) {
  // --- RESIZE LOGIC ---
  const [width, setWidth] = useState(() => {
    const saved = localStorage.getItem('sidebar-width')
    return saved ? Number(saved) : 300
  })

  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar-collapsed')
    return saved === 'true'
  })
  const [isResizing, setIsResizing] = useState(false)
  const sidebarRef = useRef<HTMLElement>(null)

  const startResizing = useCallback(() => setIsResizing(true), [])
  const stopResizing = useCallback(() => {
    setIsResizing(false)
    localStorage.setItem('sidebar-width', String(width))
  }, [width])

  const resize = useCallback(
    (e: MouseEvent) => {
      if (isResizing && sidebarRef.current) {
        const newWidth = e.clientX
        if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) setWidth(newWidth)
      }
    },
    [isResizing]
  )

  useEffect(() => {
    if (isResizing) {
      document.body.style.cursor = 'col-resize'
      window.addEventListener('mousemove', resize)
      window.addEventListener('mouseup', stopResizing)
    } else {
      document.body.style.cursor = ''
    }
    return () => {
      window.removeEventListener('mousemove', resize)
      window.removeEventListener('mouseup', stopResizing)
    }
  }, [isResizing, resize, stopResizing])

  const toggleCollapse = () => {
    const newState = !isCollapsed
    setIsCollapsed(newState)
    localStorage.setItem('sidebar-collapsed', String(newState))
  }

  // --- DND LOGIC ---
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set())
  const [activeId, setActiveId] = useState<number | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const items = useMemo(() => flattenTree(categories, expandedIds), [categories, expandedIds])

  const handleCollapse = (id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as number)
    if (expandedIds.has(event.active.id as number)) {
      handleCollapse(event.active.id as number)
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)
    if (!over) return

    const activeId = active.id as number
    const overId = over.id as number
    const activeIndex = items.findIndex((i) => i.id === activeId)
    const overIndex = items.findIndex((i) => i.id === overId)

    if (activeIndex === -1 || overIndex === -1) return

    const activeItem = items[activeIndex]
    const newItems = arrayMove(items, activeIndex, overIndex)

    const deltaX = event.delta.x
    const depthChange = Math.round(deltaX / INDENT_WIDTH)
    const newDepth = activeItem.depth + depthChange

    const previousItem = newItems[overIndex - 1]
    const maxDepth = previousItem ? previousItem.depth + 1 : 0
    const clampedDepth = Math.max(0, Math.min(newDepth, maxDepth))

    newItems[overIndex] = { ...newItems[overIndex], depth: clampedDepth }

    const updates: ChangeOrderCategoryInput[] = []
    const parentStack: { depth: number; id: number }[] = []

    newItems.forEach((item, index) => {
      while (parentStack.length > 0 && parentStack[parentStack.length - 1].depth >= item.depth) {
        parentStack.pop()
      }
      const parent = parentStack.length > 0 ? parentStack[parentStack.length - 1] : null
      updates.push({
        id: item.id,
        parentId: parent ? parent.id : null,
        order: index
      })
      parentStack.push({ depth: item.depth, id: item.id })
    })

    onReorderCategories(updates)
  }

  return {
    width,
    isCollapsed,
    isResizing,
    sidebarRef,
    startResizing,
    toggleCollapse,
    items,
    sensors,
    handleCollapse,
    handleDragStart,
    handleDragEnd,
    activeId
  }
}
