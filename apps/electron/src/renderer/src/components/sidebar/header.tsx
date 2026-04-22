'use client'

import { ReactNode } from 'react'
import { ChevronsLeft, ChevronsRight, LayoutGrid, Star, StickyNote } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/shared/ui/button'
import { ViewMode } from '@btw-app/shared'
import logo from '@/assets/logo.png'
import { useUIStore } from '@/store/uiStore'

interface HeaderProps {
  isAdmin: boolean
}

const Header = ({ isAdmin }: HeaderProps): ReactNode => {
  const { isCollapsed, viewMode, setViewMode, toggleCollapse, toggleNotes } = useUIStore()

  // Формируем список кнопок в зависимости от роли
  const viewModes = [
    ...(isAdmin
      ? [
          { mode: 'all', icon: LayoutGrid, label: 'Wszystkie snippety' },
          { mode: 'favorites', icon: Star, label: 'Ulubione' }
        ]
      : []),
    { mode: 'notes', icon: StickyNote, label: 'Szybkie notatki' }
  ]

  return (
    <div className="flex flex-col pb-2 shrink-0">
      <div
        className={cn(
          'flex items-center gap-3 pt-6 pb-2',
          isCollapsed ? 'justify-center px-0' : 'px-6'
        )}
      >
        <div className="flex items-center justify-center h-8 w-8 shrink-0 rounded-xl bg-sidebar-primary text-sidebar-primary-foreground shadow-sm">
          <img src={logo} alt="Logo" className="w-full h-full object-contain" />
        </div>
        {!isCollapsed && (
          <div className="flex flex-col animate-in fade-in duration-300">
            <h1 className="text-lg font-bold text-sidebar-foreground tracking-tight leading-none">
              BTW App
            </h1>
            <span className="text-[10px] uppercase font-bold text-sidebar-foreground/50 tracking-wider mt-1">
              {isAdmin ? 'Panel Admina' : 'Panel Nauczyciela'}
            </span>
          </div>
        )}
      </div>

      <nav className={cn('space-y-1 mt-4 shrink-0 pb-4', isCollapsed ? 'px-2' : 'px-4')}>
        {viewModes.map((item) => (
          <Button
            key={item.mode}
            variant="ghost"
            className={cn(
              'w-full rounded-xl h-10 font-medium transition-all',
              isCollapsed ? 'justify-center px-0' : 'justify-start gap-3',
              viewMode === item.mode
                ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
            )}
            onClick={() =>
              item.mode === 'notes' ? toggleNotes() : setViewMode(item.mode as ViewMode)
            }
            title={isCollapsed ? item.label : undefined}
          >
            <item.icon className="h-4.5 w-4.5 shrink-0" />
            {!isCollapsed && <span className="truncate">{item.label}</span>}
          </Button>
        ))}
      </nav>

      <div className={cn('flex mt-1', isCollapsed ? 'justify-center' : 'px-6 justify-start')}>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleCollapse}
          className="h-6 w-6 text-sidebar-foreground/50 hover:text-sidebar-foreground"
          title={isCollapsed ? 'Rozwiń pasek boczny' : 'Zwiń pasek boczny'}
        >
          {isCollapsed ? (
            <ChevronsRight className="h-4 w-4" />
          ) : (
            <ChevronsLeft className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  )
}

export default Header
