import { ReactNode } from 'react'
import { ChevronsLeft, ChevronsRight, LayoutGrid, Star, StickyNote } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ViewMode } from '@btw-app/shared'
import logo from '@/assets/logo.png'
import { useUIStore } from '@/store/uiStore'

interface HeaderProps {
  onToggleNotes: () => void
}



const Header = ({ onToggleNotes }: HeaderProps): ReactNode => {

  const { isCollapsed, viewMode, setViewMode, toggleCollapse } = useUIStore()

  const viewModes = [
    { mode: 'all', icon: LayoutGrid, label: 'Wszystkie snippety' },
    { mode: 'favorites', icon: Star, label: 'Ulubione' },
    { mode: 'notes', icon: StickyNote, label: 'Szybkie notatki' }
  ]

  return (
    <div className="flex flex-col border-b border-sidebar-border/40 pb-2 shrink-0">
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
          <h1 className="text-lg font-bold text-sidebar-foreground tracking-tight animate-in fade-in duration-300">
            BTW App
          </h1>
        )}
      </div>

      <nav
        className={cn(
          'space-y-1 mt-4 shrink-0 pb-4', // убрал border-b, чтобы перенести его на весь блок навигации, если нужно
          isCollapsed ? 'px-2' : 'px-4'
        )}
      >
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
              item.mode === 'notes' ? onToggleNotes() : setViewMode(item.mode as ViewMode)
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
          title={isCollapsed ? 'Rozwiń pasek boczny' : 'Rozwiń pasek boczny'}
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
