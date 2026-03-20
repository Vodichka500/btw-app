'use client'

import { cn } from '@/lib/utils'
import { useUIStore } from '@/store/uiStore'
import { useAuthStore } from '@/store/authStore'
import { useEffect } from 'react'
import { useNavigation } from '@/hooks/use-navigation'
import Header from './header'
import Footer from './footer'
import Categories from './categories/categories'
import { Teachers } from '@/components/sidebar/teachers/teachers'

export function Sidebar() {
  const { viewMode, isCollapsed } = useUIStore()
  const { user } = useAuthStore()
  const nav = useNavigation()

  const isAdmin = user?.role === 'ADMIN'

  // Форсируем открытие заметок для учителя
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

      {/* 🔥 ЕДИНАЯ СРЕДИНА: Общий скролл для Графика и Категорий */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pt-2 pb-4">
        {/* Контейнер без gap, чтобы закрытые аккордеоны стояли вплотную */}
        <div className="flex flex-col">
          {isAdmin && (
            <>
              <Teachers />
              <Categories />
            </>
          )}
        </div>
      </div>

      {/* Spacer для сложенного состояния */}
      {isCollapsed && <div className="flex-1" />}

      {/* FOOTER (Остается прибитым к низу) */}
      <Footer isAdmin={isAdmin} />
    </aside>
  )
}
