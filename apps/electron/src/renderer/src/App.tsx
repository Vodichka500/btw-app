import { useState } from 'react'
import { Toaster } from 'sonner'
import { Sidebar } from './components/sidebar/sidebar'
import { NotesContainer } from './components/notes/notes-container'
// import TeacherPage from './components/teacher-page'
// import { UpdaterNotification } from './components/updater-notification'
import { useUIStore } from './store/uiStore'
import type { SnippetNode } from '@/lib/trpc'
import { SnippetGrid } from '@/components/snippet/snippet-grid'
import { SnippetModal } from '@/components/snippet/snippet-modal'
import { RecycleBin } from '@/components/recycle-bin'
import { AuthGuard } from '@/components/auth/auth-guard'
import AccountPage from '@/components/account/account-page'
import UsersPage from '@/components/users-page'
import { Schedule } from '@/components/schedule'
import TeacherPage from '@/components/teacher-page'

export default function App() {
  const { viewMode } = useUIStore()

  // Стейт для модалки создания/редактирования сниппетов
  const [snipModal, setSnipModal] = useState<{
    open: boolean
    edit: SnippetNode | null
  }>({ open: false, edit: null })

  // --- Handlers ---
  const handleOpenCreateSnip = () => setSnipModal({ open: true, edit: null })
  const handleOpenEditSnip = (s: SnippetNode) => setSnipModal({ open: true, edit: s })

  // Рендерим нужный экран в зависимости от viewMode
  const renderMainContent = () => {
    switch (viewMode) {
      case 'account':
        return <AccountPage />

      case 'users':
        return <UsersPage/>

      case 'trash':
        return <RecycleBin />

      case 'teacher':
        return <TeacherPage />

      case 'notes':
        return null

      case 'all':
      case 'category':
        return (
          <SnippetGrid onCreateSnippet={handleOpenCreateSnip} onEditSnippet={handleOpenEditSnip} />
        )

      default:
        return (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Выберите категорию или режим просмотра
          </div>
        )
    }
  }

  return (
    <AuthGuard>
      <div className="flex h-screen overflow-hidden bg-background font-sans text-foreground">
        <Sidebar />

        {/* MAIN CONTENT */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
          {renderMainContent()}
          <NotesContainer />
        </main>

        {/* MODAL сама стянет плоский список категорий для селекта */}
        {snipModal.open && (
          <SnippetModal
            open={snipModal.open}
            onClose={() => setSnipModal({ open: false, edit: null })}
            editSnippet={snipModal.edit}
          />
        )}

        {/*<UpdaterNotification />*/}
        <Toaster position="bottom-right" richColors closeButton />
      </div>
    </AuthGuard>
  )
}
