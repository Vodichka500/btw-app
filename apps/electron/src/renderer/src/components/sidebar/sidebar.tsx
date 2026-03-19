'use client'

import { cn } from '@/lib/utils'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useUIStore } from '@/store/uiStore'
import { useAuthStore } from '@/store/authStore'
import { useEffect } from 'react'
import { useNavigation } from '@/hooks/use-navigation'
import Header from './header'
import Footer from './footer'
import Categories from './categories/categories'
import { Teachers } from '@/components/sidebar/teachers/teachers'
// import Schedule from './schedule/schedule' // Раскомментируй, если используешь

export function Sidebar() {
  const { viewMode, isCollapsed } = useUIStore()
  const { user } = useAuthStore()
  const nav = useNavigation()

  const isAdmin = user?.role === 'ADMIN'

  // Форсируем открытие заметок для учителя, если он зашел куда-то не туда
  useEffect(() => {
    if (user?.role === 'TEACHER' && viewMode !== 'notes' && viewMode !== 'account') {
      nav.openNotesFull()
    }
  }, [user?.role, viewMode, nav])

  return (
    <aside
      className={cn(
        'flex flex-col h-screen overflow-hidden bg-sidebar border-r border-sidebar-border select-none shrink-0 transition-[width] duration-300 ease-in-out z-20',
        isCollapsed ? 'w-[70px]' : 'w-64'
      )}
    >
      {/* HEADER */}
      <Header isAdmin={isAdmin} />

      <div className="h-px bg-sidebar-border mx-4 shrink-0" />

      {/* Средина: Скроллируемая зона */}
      <ScrollArea className="flex-1 w-full overflow-hidden">
        <div className="flex flex-col py-2">
          {/* Скрываем категории и расписание от учителя */}
          {isAdmin && (
            <>
              <Categories />
              <Teachers />
              {/* <Schedule scheduleOpen={true} setScheduleOpen={() => {}} /> */}
            </>
          )}
        </div>
      </ScrollArea>

      {/* Spacer */}
      {isCollapsed && <div className="flex-1" />}

      {/* FOOTER */}
      <Footer isAdmin={isAdmin} />
    </aside>
  )
}
