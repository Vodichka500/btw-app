'use client'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Trash2, UserCircle, GraduationCap, User } from 'lucide-react'
import { useUIStore } from '@/store/uiStore'

interface FooterProps {
  isAdmin: boolean
}

const Footer = ({ isAdmin }: FooterProps) => {
  const { isCollapsed, viewMode, setViewMode } = useUIStore()

  return (
    <div
      className={cn(
        'mt-auto border-t border-sidebar-border space-y-2 shrink-0 z-20 bg-sidebar py-4',
        isCollapsed ? 'px-2' : 'px-4'
      )}
    >
      {/* Кнопки управления (Только для админа) */}
      {isAdmin && (
        <>
          <Button
            variant="ghost"
            className={cn(
              'w-full rounded-xl text-sidebar-foreground hover:bg-sidebar-accent',
              isCollapsed ? 'justify-center px-0' : 'justify-start gap-3',
              viewMode === 'teacher' && 'bg-sidebar-accent text-sidebar-accent-foreground'
            )}
            onClick={() => setViewMode('users')} // Приведение типа, если 'teacher' еще нет в ViewMode
            title="Użytkowniki"
          >
            <User className="h-4.5 w-4.5 shrink-0" />
            {!isCollapsed && <span>Użytkowniki</span>}
          </Button>
          <Button
            variant="ghost"
            className={cn(
              'w-full rounded-xl text-sidebar-foreground hover:bg-sidebar-accent',
              isCollapsed ? 'justify-center px-0' : 'justify-start gap-3',
              viewMode === 'teacher' && 'bg-sidebar-accent text-sidebar-accent-foreground'
            )}
            onClick={() => setViewMode('teacher' as any)} // Приведение типа, если 'teacher' еще нет в ViewMode
            title="Nauczyciele"
          >
            <GraduationCap className="h-4.5 w-4.5 shrink-0" />
            {!isCollapsed && <span>Nauczyciele</span>}
          </Button>

          <Button
            variant="ghost"
            className={cn(
              'w-full rounded-xl text-sidebar-foreground hover:bg-sidebar-accent',
              isCollapsed ? 'justify-center px-0' : 'justify-start gap-3',
              viewMode === 'trash' && 'bg-sidebar-accent text-sidebar-accent-foreground'
            )}
            onClick={() => setViewMode('trash')}
            title="Kosz"
          >
            <Trash2 className="h-4.5 w-4.5 shrink-0" />
            {!isCollapsed && <span>Kosz</span>}
          </Button>
        </>
      )}

      {/* Кнопка Аккаунта (Для всех) */}
      <Button
        variant="ghost"
        className={cn(
          'w-full rounded-xl text-sidebar-foreground hover:bg-sidebar-accent',
          isCollapsed ? 'justify-center px-0' : 'justify-start gap-3',
          viewMode === 'account' && 'bg-sidebar-accent text-sidebar-accent-foreground'
        )}
        onClick={() => setViewMode('account')}
        title="Konto"
      >
        <UserCircle className="h-4.5 w-4.5 shrink-0" />
        {!isCollapsed && <span>Konto</span>}
      </Button>
    </div>
  )
}

export default Footer
