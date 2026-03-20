'use client'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Trash2, UserCircle, User, Settings } from 'lucide-react'
import { useUIStore } from '@/store/uiStore'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu'

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
      {/* 🆕 Группируем админские настройки в DropdownMenu */}
      {isAdmin && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className={cn(
                'w-full rounded-xl text-sidebar-foreground hover:bg-sidebar-accent',
                isCollapsed ? 'justify-center px-0' : 'justify-start gap-3',
                (viewMode === 'users' || viewMode === 'teacher' || viewMode === 'trash') &&
                  'bg-sidebar-accent/50'
              )}
              title="Ustawienia bazy"
            >
              <Settings className="h-4.5 w-4.5 shrink-0" />
              {!isCollapsed && <span>Ustawienia</span>}
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align={isCollapsed ? 'center' : 'start'}
            side="right"
            sideOffset={12}
            className="w-48 rounded-xl"
          >
            <DropdownMenuItem onClick={() => setViewMode('users')} className="gap-2 cursor-pointer">
              <User className="h-4 w-4 text-muted-foreground" />
              <span>Użytkowniki</span>
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() => setViewMode('trash')}
              className="gap-2 cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4" />
              <span>Kosz</span>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={() => setViewMode('settings')}
              className="gap-2 cursor-pointer"
            >
              <Settings className="h-4 w-4 text-muted-foreground" />
              <span>Ustawenia</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* Кнопка Аккаунта (Всегда на виду) */}
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
