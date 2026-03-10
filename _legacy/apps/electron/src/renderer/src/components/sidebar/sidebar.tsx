'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { useSidebar } from '@/hooks/use-sidebar'

import Header from '@/components/sidebar/header'
import Footer from '@/components/sidebar/footer'
import Categories from '@/components/sidebar/categories/categories'
import { useUIStore } from '@/store/uiStore'
import { useCategories } from '@/hooks/use-categories'
import { Schedule } from '@/components/sidebar/schedule/schedule'
import { ScrollArea } from '@/components/ui/scroll-area'

const COLLAPSED_WIDTH = 70

interface SidebarProps {
  onToggleNotes: () => void
}

export function Sidebar({ onToggleNotes }: SidebarProps): React.ReactNode {
  const [categoryOpen, setCategoryOpen] = React.useState(false)
  const [scheduleOpen, setScheduleOpen] = React.useState(false)

  const { categories, updateCategoryStructure } = useCategories()
  const { isCollapsed } = useUIStore()

  const { width, isResizing, sidebarRef, startResizing } = useSidebar(
    categories,
    updateCategoryStructure
  )

  return (
    <aside
      ref={sidebarRef}
      className={cn(
        'flex flex-col h-screen overflow-hidden bg-sidebar border-r border-sidebar-border select-none relative group/sidebar shrink-0',
        isResizing ? 'transition-none' : 'transition-[width] duration-300 ease-in-out'
      )}
      style={{ width: isCollapsed ? COLLAPSED_WIDTH : width }}
    >
      {/* HEADER */}
      <Header onToggleNotes={onToggleNotes} />

      <div className="h-px bg-sidebar-border mx-4 shrink-0" />

      <ScrollArea className="flex-1 w-full overflow-hidden">
        <div className="flex flex-col py-2">
          <Categories categoryOpen={categoryOpen} setCategoryOpen={setCategoryOpen} />
          <Schedule scheduleOpen={scheduleOpen} setScheduleOpen={setScheduleOpen} />
        </div>
      </ScrollArea>

      {/* Spacer */}
      {isCollapsed && <div className="flex-1" />}

      {/* FOOTER */}
      <Footer />

      {/* Resizer */}
      {!isCollapsed && (
        <div
          className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize z-50 bg-transparent hover:bg-transparent active:bg-transparent"
          onMouseDown={startResizing}
        />
      )}
    </aside>
  )
}
