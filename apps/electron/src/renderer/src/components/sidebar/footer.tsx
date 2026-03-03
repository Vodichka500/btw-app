import { cn } from '@/lib/utils'
import { UserNav } from '@/components/sidebar/user-nav'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import { useUIStore } from '@/store/uiStore'


const Footer = () => {

    const { isCollapsed, viewMode, setViewMode } = useUIStore()

  return (
    <div
      className={cn(
        // mt-auto: отталкивает футер в самый низ
        // shrink-0: запрещает футеру сжиматься, если контента сверху слишком много
        'mt-auto border-t border-sidebar-border space-y-2 shrink-0 z-20 bg-sidebar py-4',
        isCollapsed ? 'px-2' : 'px-4'
      )}
    >
      <UserNav isCollapsed={isCollapsed} />

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
        <Trash2 className="h-4 w-4 shrink-0" />
        {!isCollapsed && <span>Kosz</span>}
      </Button>
    </div>
  )
}

export default Footer
