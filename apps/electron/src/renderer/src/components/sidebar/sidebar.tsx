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

// 🔥 Komponent wielokrotnego użytku dla elementów menu (DRY)
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
        // 🔥 1. Вернули w-full и h-10, чтобы кнопка занимала всю ширину сайдбара
        'w-full h-10 font-medium',
        'text-xs uppercase flex transition-colors cursor-pointer',
        // 🔥 2. Добавили "!" перед px (!px-0 и !px-6), чтобы перебить дефолтный px-4 из <Button>
        isCollapsed ? 'justify-center !px-0' : 'justify-start !px-6 gap-3',
        currentView === id
          ? 'text-primary bg-primary/5'
          : 'text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent'
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {!isCollapsed && <span className="truncate">{label}</span>}
    </Button>
  )
}

export function Sidebar() {
  const { viewMode, isCollapsed, setViewMode } = useUIStore()
  const { user } = useAuthStore()

  const isAdmin = user?.role === 'ADMIN'
  const isManager = user?.role === 'MANAGER'
  const canManage = isAdmin || isManager // Dostęp dla obu ról

  useEffect(() => {
    if (user?.role === 'TEACHER' && viewMode !== 'account' && viewMode !== 'sendReports') {
      setViewMode('sendReports')
    }
  }, [user?.role, viewMode, setViewMode])

  // 🔥 Tablica z elementami menu dla menedżerów/adminów
  const adminMenuItems = [
    { id: 'customers', label: 'Klienci', icon: Users },
    { id: 'billing', label: 'Opłaty', icon: CreditCard },
    { id: 'subjects', label: 'Przedmioty', icon: BookOpen },
    { id: 'reports', label: 'Raporty', icon: FileText }
  ]

  return (
    <aside
      className={cn(
        'flex flex-col h-screen overflow-hidden bg-sidebar border-r border-sidebar-border select-none shrink-0 transition-[width] duration-300 ease-in-out z-20',
        isCollapsed ? 'w-[70px]' : 'w-64'
      )}
    >
      <Header isAdmin={canManage} />

      <div className="h-px bg-sidebar-border mx-4 shrink-0" />

      <div
        className={cn(
          'flex-1 custom-scrollbar pt-2 pb-4',
          isCollapsed ? 'overflow-hidden' : 'overflow-y-auto'
        )}
      >
        <div className="flex flex-col">
          {canManage && (
            <>
              <Teachers />
              <Categories />

              {/* 🔥 Generowanie menu za pomocą .map() */}
              {adminMenuItems.map((item) => (
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
            </>
          )}

          {/* Przycisk dostępny dla wszystkich (nauczycieli, adminów i managerów) */}
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


      <Footer isAdmin={isAdmin} />
    </aside>
  )
}
