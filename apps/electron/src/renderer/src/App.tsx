import { ReactNode, useState, useEffect, useMemo } from 'react'
import { Toaster } from 'sonner'

// --- Components ---
import { Sidebar } from '@/components/sidebar/sidebar'
import { SnippetGrid } from '@/components/snippet/snippet-grid'
import { RecycleBin } from '@/components/recycle-bin'
import { SnippetModal } from '@/components/snippet/snippet-modal'
import { NotesContainer } from '@/components/notes/notes-container'

// --- Custom Hooks ---
import { useNavigation } from '@/hooks/use-navigation'
import { useCategories } from '@/hooks/use-categories'
import { useSnippets } from '@/hooks/use-snippets'
import { useTrash } from '@/hooks/use-trash'
import { useUIStore } from '@/store/uiStore'

// --- Types ---
import { CategoryWithChildren, SnippetWithCategory } from '@btw-app/shared'
import TeacherPage from '@/components/teacher-page'
import { UpdaterNotification } from '@/components/updater-notification'

// --- Helpers ---
function flattenCategories(cats: CategoryWithChildren[]): CategoryWithChildren[] {
  const result: CategoryWithChildren[] = []
  for (const cat of cats) {
    result.push(cat)
    if (cat.children && cat.children.length > 0) {
      result.push(...flattenCategories(cat.children))
    }
  }
  return result
}

function findCategoryName(cats: CategoryWithChildren[], id: number): string {
  const flat = flattenCategories(cats)
  return flat.find((c) => c.id === id)?.name || 'Category'
}

export default function App(): ReactNode {
  const nav = useNavigation()
  const cats = useCategories()
  const { viewMode, selectedCategoryId } = useUIStore()
  const snips = useSnippets(viewMode, selectedCategoryId, nav.searchQuery)
  const trash = useTrash()

  // Стейт для модалки сниппетов (Модалка категорий теперь живет внутри Categories.tsx)
  const [snipModal, setSnipModal] = useState<{
    open: boolean
    edit: SnippetWithCategory | null
  }>({ open: false, edit: null })

  useEffect(() => {
    if (viewMode === 'trash') {
      trash.fetchTrash()
    }
  }, [viewMode, trash.fetchTrash])

  // --- Snippet Handlers ---
  const handleOpenCreateSnip = () => setSnipModal({ open: true, edit: null })
  const handleOpenEditSnip = (s: SnippetWithCategory) => setSnipModal({ open: true, edit: s })

  const handleSaveSnippet = async (data: any) => {
    if (snipModal.edit) {
      await snips.updateSnippet(snipModal.edit.id, data)
    } else {
      await snips.createSnippet(data)
    }
    setSnipModal({ open: false, edit: null })
  }

  // --- Trash Handlers ---
  const handleRestore = async (type: 'category' | 'snippet', id: number) => {
    await trash.restore(type, id)
    await cats.fetchCategories()
    await snips.refresh()
  }

  // --- Helpers ---
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const currentSubCategories = useMemo(() => {
    if (viewMode === 'category' && selectedCategoryId) {
      return cats.getSubcategories(selectedCategoryId)
    }
    return []
  }, [viewMode, selectedCategoryId, cats.categories, cats.getSubcategories])

  const renderMainContent = () => {
    if (viewMode === 'trash') {
      return (
        <RecycleBin
          items={trash.items}
          loading={trash.loading}
          onRestore={handleRestore}
          onHardDelete={trash.hardDelete}
          onEmptyTrash={trash.emptyTrash}
        />
      )
    }
    if (['all', 'favorites', 'category'].includes(viewMode)){
      return (
        <SnippetGrid
          snippets={snips.filteredSnippets}
          loading={snips.loading}
          searchQuery={nav.searchQuery}
          viewMode={viewMode}
          categoryName={
            selectedCategoryId ? findCategoryName(cats.categories, selectedCategoryId) : undefined
          }
          onSearchChange={nav.setSearchQuery}
          onCreateSnippet={handleOpenCreateSnip}
          onEditSnippet={handleOpenEditSnip}
          onDeleteSnippet={snips.deleteSnippet}
          onToggleFavorite={snips.toggleFavorite}
          subCategories={currentSubCategories}
          onCategoryClick={(id) => nav.handleViewChange('category', id)}
          onReorderSnippets={snips.reorderSnippets}
        />
      )
    }
    if (viewMode === 'teacher') {
      return (
        <TeacherPage/>
      )
    }
    if (viewMode === 'notes') {
      return null // Notes рендерятся отдельно, так как могут быть плавающими
    }
    else {
      return <div className="p-8 text-center text-muted-foreground">Выберите категорию или режим просмотра</div>
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background font-sans text-foreground">
      {/* SIDEBAR (Теперь чистый и красивый) */}
      <Sidebar onToggleNotes={nav.openNotesFull} />

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {renderMainContent()}
        <NotesContainer
          isVisible={viewMode === 'notes' || nav.isNotesFloating}
          isFullScreen={viewMode === 'notes'}
          onToggleMode={nav.toggleNotesMode}
          onClose={nav.closeNotes}
        />
      </main>

      <SnippetModal
        open={snipModal.open}
        onClose={() => setSnipModal({ open: false, edit: null })}
        onSave={handleSaveSnippet}
        editSnippet={snipModal.edit}
        flatCategories={flattenCategories(cats.categories)}
        defaultCategoryId={viewMode === 'category' ? selectedCategoryId : null}
      />

      <UpdaterNotification />
      <Toaster position="bottom-right" richColors closeButton />
    </div>
  )
}
