import { ReactNode } from 'react'
import { LayoutGrid, Star, StickyNote, PanelRight } from 'lucide-react'
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

  const viewModes = isAdmin
    ? [
        { mode: 'all', icon: LayoutGrid, label: 'Wszystkie snippety' },
        { mode: 'favorites', icon: Star, label: 'Ulubione' },
        { mode: 'notes', icon: StickyNote, label: 'Szybkie notatki' } // Нотатки теперь только для админов
      ]
    : [] // Учителям здесь нечего показывать

  return (
    <div className="flex flex-col pb-2 shrink-0">
      <div
        className={cn(
          'flex items-center pt-6 pb-2',
          isCollapsed ? 'justify-center px-0' : 'px-6 justify-between'
        )}
      >
        <div className="flex items-center gap-3">
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

        {/* 🔥 Кнопка сужения справа от лого в развернутом виде */}
        {!isCollapsed && (
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleCollapse}
            className="h-6 w-6 text-sidebar-foreground/50 hover:text-sidebar-foreground shrink-0"
            title="Zwiń pasek boczny"
          >
            <PanelRight className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Навигация */}
      {!isCollapsed && viewModes.length > 0 && (
        <nav className={cn('space-y-1 mt-4 shrink-0 pb-4', isCollapsed ? 'px-2' : 'px-2.5')}>
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
              <span className="truncate">{item.label}</span>
            </Button>
          ))}
        </nav>
      )}

      {/* Отступ, если у учителя нет кнопок навигации */}
      {viewModes.length === 0 && <div className="mt-4" />}

      {/* 🔥 Кнопка расширения под навигацией в свернутом виде */}
      {isCollapsed && (
        <div className="flex mt-1 justify-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleCollapse}
            className="h-6 w-6 text-sidebar-foreground/50 hover:text-sidebar-foreground"
            title="Rozwiń pasek boczny"
          >
            <PanelRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}

export default Header
