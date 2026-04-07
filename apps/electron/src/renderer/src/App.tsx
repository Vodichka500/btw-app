import { useState } from 'react'
import { Toaster } from 'sonner'

// Core & State
import { useUIStore } from './store/uiStore'
import type { SnippetNode } from '@/lib/trpc'

// Shared UI
import { TooltipProvider } from '@/components/shared/ui/tooltip'

// Features
import { Sidebar } from './components/sidebar/sidebar'
import { AuthGuard } from '@/components/features/auth/auth-guard'
import { NotesContainer } from './components/features/notes/notes-container'
import { SnippetGrid } from '@/components/features/snippet/snippet-grid'
import { SnippetModal } from '@/components/features/snippet/snippet-modal'
import { UpdaterNotification } from '@/components/features/update/updater-notification'

// Pages
import AccountPage from '@/components/pages/account-page'
import CustomersPage from '@/components/pages/customers-page'
import { RecycleBinPage } from '@/components/pages/recycle-bin-page'
import { SettingsPage } from '@/components/pages/settings-page'
import TeacherPage from '@/components/pages/teacher-page'
import UsersPage from '@/components/pages/users-page'
import { BillingPage } from '@/components/pages/billing-page'
import SubjectsPage from '@/components/pages/subjects-page'

export default function App() {
  const { viewMode } = useUIStore()

  // Глобальное состояние модалки для сниппетов
  const [snipModal, setSnipModal] = useState<{
    open: boolean
    edit: SnippetNode | null
  }>({ open: false, edit: null })

  const handleOpenCreateSnip = () => setSnipModal({ open: true, edit: null })
  const handleOpenEditSnip = (s: SnippetNode) => setSnipModal({ open: true, edit: s })

  const NAVIGATION_MAP: Record<string, React.ReactNode> = {
    account: <AccountPage />,
    users: <UsersPage />,
    trash: <RecycleBinPage />,
    teacher: <TeacherPage />,
    customers: <CustomersPage />,
    settings: <SettingsPage />,
    billing: <BillingPage />,
    subjects: <SubjectsPage />,
    notes: null, // Контент отображается в NotesContainer отдельно
    all: <SnippetGrid onCreateSnippet={handleOpenCreateSnip} onEditSnippet={handleOpenEditSnip} />,
    category: (
      <SnippetGrid onCreateSnippet={handleOpenCreateSnip} onEditSnippet={handleOpenEditSnip} />
    )
  }

  return (
    <AuthGuard>
      <TooltipProvider>
        <div className="flex h-screen overflow-hidden bg-background font-sans text-foreground">
          <Sidebar />

          <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
            {NAVIGATION_MAP[viewMode] ?? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                Выберите категорию или режим просмотра
              </div>
            )}

            <NotesContainer />
          </main>

          {/* Глобальные модалки и уведомления */}
          {snipModal.open && (
            <SnippetModal
              open={snipModal.open}
              onClose={() => setSnipModal({ open: false, edit: null })}
              editSnippet={snipModal.edit}
            />
          )}

          <UpdaterNotification />
          <Toaster position="bottom-right" richColors closeButton />
        </div>
      </TooltipProvider>
    </AuthGuard>
  )
}
