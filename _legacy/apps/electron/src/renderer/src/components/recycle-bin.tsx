'use client'

import { ReactNode, useState } from 'react'
import { Trash2, RotateCcw, Loader2, AlertTriangle, FileText, Folder } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import type { RecycleBinItem, RecycleBinItemType } from '@btw-app/shared'

interface RecycleBinProps {
  items: RecycleBinItem[]
  loading: boolean
  onRestore: (type: RecycleBinItemType, id: number) => Promise<void>
  onHardDelete: (type: RecycleBinItemType, id: number) => Promise<void>
  onEmptyTrash: () => Promise<void>
}

export function RecycleBin({
  items,
  loading,
  onRestore,
  onHardDelete,
  onEmptyTrash
}: RecycleBinProps): ReactNode {
  const [actionId, setActionId] = useState<string | null>(null)
  const [emptying, setEmptying] = useState(false)

  // Обертки нужны, чтобы управлять локальным стейтом загрузки (спиннером на кнопке)
  const handleRestoreClick = async (type: RecycleBinItemType, id: number): Promise<void> => {
    setActionId(`restore-${type}-${id}`)
    try {
      await onRestore(type, id)
      // toast.success('Item restored successfully.')
    } catch (e) {
      console.error(e)
    } finally {
      setActionId(null)
    }
  }

  const handleHardDeleteClick = async (type: RecycleBinItemType, id: number): Promise<void> => {
    setActionId(`delete-${type}-${id}`)
    try {
      await onHardDelete(type, id)
      // toast.success('Item permanently deleted.')
    } catch (e) {
      console.error(e)
    } finally {
      setActionId(null)
    }
  }

  const handleEmptyTrashClick = async (): Promise<void> => {
    setEmptying(true)
    try {
      await onEmptyTrash()
      // toast.success('Trash emptied.')
    } catch (e) {
      console.error(e)
    } finally {
      setEmptying(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-background h-full">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 px-8 py-6 border-b border-border/40">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Trash2 className="h-6 w-6 text-muted-foreground" />
            Kosz
          </h2>
          <p className="text-sm text-muted-foreground mt-1 font-medium">
            {loading ? 'Sprawdzanie kosza...' : `${items.length} znalezionych elementów.`}
          </p>
        </div>
        {!loading && items.length > 0 && (
          <Button
            variant="destructive"
            size="sm"
            onClick={handleEmptyTrashClick}
            disabled={emptying}
            className="gap-2 rounded-xl shadow-sm"
          >
            {emptying ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <AlertTriangle className="h-4 w-4" />
            )}
            Opróżnij kosz
          </Button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={`trash-skel-${i}`}
                className="flex items-center gap-4 p-4 rounded-2xl bg-card border border-border/50"
              >
                <Skeleton className="h-10 w-10 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-40 rounded-lg" />
                  <Skeleton className="h-3 w-24 rounded-lg" />
                </div>
                <Skeleton className="h-8 w-20 rounded-xl" />
                <Skeleton className="h-8 w-20 rounded-xl" />
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[60vh] text-center opacity-80">
            <div className="flex items-center justify-center h-20 w-20 rounded-3xl bg-secondary/50 mb-6">
              <Trash2 className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">Kosz jest pusty</h3>
            <p className="text-muted-foreground">
              Usunięte elementy pojawią się tutaj.
              <br />
              Możesz je przywrócić w dowolnym momencie.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => {
              const isRestoring = actionId === `restore-${item.type}-${item.id}`
              const isDeleting = actionId === `delete-${item.type}-${item.id}`

              return (
                <div
                  key={`${item.type}-${item.id}`}
                  className="group flex items-center gap-4 p-4 rounded-2xl bg-card border border-border/40 shadow-sm hover:shadow-md hover:border-border/80 transition-all duration-200"
                >
                  <div className="flex items-center justify-center h-12 w-12 shrink-0 rounded-2xl bg-secondary/70 text-secondary-foreground">
                    {item.type === 'snippet' ? (
                      <FileText className="h-6 w-6" />
                    ) : (
                      <Folder className="h-6 w-6" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-base font-semibold text-foreground truncate">{item.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="inline-flex items-center rounded-md bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground ring-1 ring-inset ring-gray-500/10">
                        {item.type === 'snippet' ? 'Snippet' : 'Kategoria'}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Usunięto {new Date(item.deletedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleRestoreClick(item.type, item.id)}
                      disabled={!!actionId}
                      className="gap-1.5 rounded-xl h-9"
                    >
                      {isRestoring ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <RotateCcw className="h-3.5 w-3.5" />
                      )}
                      Przywróć
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleHardDeleteClick(item.type, item.id)}
                      disabled={!!actionId}
                      className="gap-1.5 rounded-xl h-9 text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      {isDeleting ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                      Usuń
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
