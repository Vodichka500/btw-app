'use client'

import { cn } from '@/lib/utils'
import { useUIStore } from '@/store/uiStore'
import { useAuthStore } from '@/store/authStore'
import { useEffect } from 'react'
import Header from './header'
import Footer from './footer'
import Categories from './categories/categories'
import { Teachers } from '@/components/sidebar/teachers/teachers'
import { Button } from '@/components/shared/ui/button'

export function Sidebar() {
  const { viewMode, isCollapsed, setViewMode } = useUIStore()
  const { user } = useAuthStore()

  // 🔥 Разделяем уровни доступа
  const isAdmin = user?.role === 'ADMIN'
  const isManager = user?.role === 'MANAGER'
  const canManage = isAdmin || isManager // Пускаем и тех, и других

  // Форсируем открытие заметок для учителя
  useEffect(() => {
    if (
      user?.role === 'TEACHER' &&
      viewMode !== 'notes' &&
      viewMode !== 'account' &&
      viewMode !== 'sendReports'
    ) {
      setViewMode('notes')
    }
  }, [user?.role, viewMode, setViewMode])

  return (
    <aside
      className={cn(
        'flex flex-col h-screen overflow-hidden bg-sidebar border-r border-sidebar-border select-none shrink-0 transition-[width] duration-300 ease-in-out z-20',
        isCollapsed ? 'w-[70px]' : 'w-64'
      )}
    >
      {/* Оставляем пропс isAdmin, если внутри хедера есть жесткие настройки */}
      <Header isAdmin={isAdmin} />

      <div className="h-px bg-sidebar-border mx-4 shrink-0" />

      <div className="flex-1 overflow-y-auto custom-scrollbar pt-2 pb-4">
        <div className="flex flex-col">
          {/* 🔥 Меняем проверку на canManage */}
          {canManage && (
            <>
              <Teachers />
              <Categories />
              <Button
                variant="ghost"
                onClick={() => setViewMode('customers')}
                className={cn(
                  'px-6 text-xs uppercase flex justify-start transition-colors cursor-pointer',
                  viewMode === 'customers'
                    ? 'text-primary bg-primary/5'
                    : 'text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent'
                )}
              >
                {!isCollapsed && <span className="truncate">Klienci</span>}
              </Button>
              <Button
                variant="ghost"
                onClick={() => setViewMode('billing')}
                className={cn(
                  'px-6 text-xs uppercase flex justify-start transition-colors cursor-pointer',
                  viewMode === 'billing'
                    ? 'text-primary bg-primary/5'
                    : 'text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent'
                )}
              >
                {!isCollapsed && <span className="truncate">Opłaty</span>}
              </Button>
              <Button
                variant="ghost"
                onClick={() => setViewMode('subjects')}
                className={cn(
                  'px-6 text-xs uppercase flex justify-start transition-colors cursor-pointer',
                  viewMode === 'subjects'
                    ? 'text-primary bg-primary/5'
                    : 'text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent'
                )}
              >
                {!isCollapsed && <span className="truncate">Przedmioty</span>}
              </Button>
              <Button
                variant="ghost"
                onClick={() => setViewMode('reports')}
                className={cn(
                  'px-6 text-xs uppercase flex justify-start transition-colors cursor-pointer',
                  viewMode === 'reports'
                    ? 'text-primary bg-primary/5'
                    : 'text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent'
                )}
              >
                {!isCollapsed && <span className="truncate">Reports</span>}
              </Button>
            </>
          )}

          <Button
            variant="ghost"
            onClick={() => setViewMode('sendReports')}
            className={cn(
              'px-6 text-xs uppercase flex justify-start transition-colors cursor-pointer',
              viewMode === 'sendReports'
                ? 'text-primary bg-primary/5'
                : 'text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent'
            )}
          >
            {!isCollapsed && <span className="truncate">Send Reports</span>}
          </Button>
        </div>
      </div>

      {isCollapsed && <div className="flex-1" />}

      <Footer isAdmin={isAdmin} />
    </aside>
  )
}
