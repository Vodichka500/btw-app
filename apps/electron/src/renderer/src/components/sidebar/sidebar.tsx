import { cn } from '@/lib/utils'
import { useUIStore } from '@/store/uiStore'
import { useAuthStore } from '@/store/authStore'
import { useEffect } from 'react'
import Header from './header'
import Footer from './footer'
import Categories from './categories/categories'
import { Teachers } from '@/components/sidebar/teachers/teachers'
import { Button } from '@/components/shared/ui/button'
import { Users, CreditCard, BookOpen, FileText, Send, LucideIcon } from 'lucide-react'

// 🔥 Компонент элемента меню с "воздушным" дизайном
function SidebarNavItem({
  id,
  label,
  icon: Icon,
  currentView,
  isCollapsed,
  onClick
}: {
  id: string
  label: string
  icon: LucideIcon
  currentView: string
  isCollapsed: boolean
  onClick: () => void
}) {
  return (
    <Button
      variant="ghost"
      onClick={onClick}
      title={isCollapsed ? label : undefined}
      className={cn(
        'w-full h-11 flex items-center transition-all duration-300 ease-in-out cursor-pointer rounded-sm mb-1 relative group',
        'text-sm font-semibold tracking-tight',
        isCollapsed ? 'justify-center !px-0' : 'justify-start !px-4 gap-3',
        currentView === id
          ? 'bg-card text-primary shadow-[0_4px_12px_rgba(0,0,0,0.03)] border border-primary/5'
          : 'text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-card/50 hover:shadow-sm'
      )}
    >
      <Icon
        className={cn(
          'h-[18px] w-[18px] shrink-0 transition-all duration-300',
          currentView === id
            ? 'text-primary scale-110'
            : 'text-sidebar-foreground/40 group-hover:text-primary/70 group-hover:scale-110'
        )}
      />
      {!isCollapsed && <span className="truncate">{label}</span>}

      {/* Индикатор активного состояния — теперь в виде мягкой точки справа */}
      {currentView === id && !isCollapsed && (
        <div className="absolute right-3 w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
      )}
    </Button>
  )
}

export function Sidebar() {
  const { viewMode, isCollapsed, setViewMode } = useUIStore()
  const { user } = useAuthStore()

  const isAdmin = user?.role === 'ADMIN'
  const isManager = user?.role === 'MANAGER'
  const canManage = isAdmin || isManager

  useEffect(() => {
    if (user?.role === 'TEACHER' && viewMode !== 'account' && viewMode !== 'sendReports') {
      setViewMode('sendReports')
    }
  }, [user?.role, viewMode, setViewMode])

  const adminMenuItems = [
    { id: 'customers', label: 'Klienci', icon: Users },
    { id: 'billing', label: 'Opłaty', icon: CreditCard },
    { id: 'subjects', label: 'Przedmioty', icon: BookOpen },
    { id: 'reports', label: 'Raporty', icon: FileText }
  ]

  return (
    <aside
      className={cn(
        'flex flex-col h-screen overflow-hidden bg-secondary/40 backdrop-blur-md border-r border-sidebar-border/50 select-none shrink-0 transition-all duration-500 ease-in-out z-20',
        'shadow-[inset_-10px_0_20px_-15px_rgba(0,0,0,0.05)]', // Внутренняя тень для глубины
        isCollapsed ? 'w-[78px]' : 'w-64'
      )}
    >
      <div className="p-2 shrink-0">
        <Header isAdmin={canManage} />
      </div>

      {/* Мягкий градиентный разделитель */}
      <div className="h-px bg-gradient-to-r from-transparent via-sidebar-border/60 to-transparent mx-6 shrink-0" />

      <div
        className={cn(
          'flex-1 custom-scrollbar pt-4 pb-4 px-3',
          isCollapsed ? 'overflow-hidden px-2' : 'overflow-y-auto'
        )}
      >
        <div className="flex flex-col gap-1">
          {/* Секции Teachers и Categories внутри Sidebar обычно требуют легкого отступа */}
          <div className="mb-4 space-y-4">
            <Teachers />
            <Categories />
          </div>

          <div className="space-y-1 mb-4">
            {!isCollapsed && (
              <p className="px-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50 mb-2">
                Zarządzanie
              </p>
            )}
            {canManage &&
              adminMenuItems.map((item) => (
                <SidebarNavItem
                  key={item.id}
                  id={item.id}
                  label={item.label}
                  icon={item.icon}
                  currentView={viewMode}
                  isCollapsed={isCollapsed}
                  onClick={() => setViewMode(item.id as any)}
                />
              ))}
            <SidebarNavItem
              id="sendReports"
              label="Wyślij Raporty"
              icon={Send}
              currentView={viewMode}
              isCollapsed={isCollapsed}
              onClick={() => setViewMode('sendReports')}
            />
          </div>
        </div>
      </div>

      <div className="p-3 bg-gradient-to-t from-secondary/20 to-transparent">
        <Footer isAdmin={isAdmin} />
      </div>
    </aside>
  )
}
