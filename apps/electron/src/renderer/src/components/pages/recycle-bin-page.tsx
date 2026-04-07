'use client'

import { ReactNode, useMemo, useState } from 'react'
import {
  Trash2,
  RotateCcw,
  Loader2,
  AlertTriangle,
  FileText,
  Folder,
  CornerDownRight
} from 'lucide-react'
import { Button } from '@/components/shared/ui/button'
import { Skeleton } from '@/components/shared/ui/skeleton'
import { AsyncView } from '@/components/shared/async-view'
import { useTrash } from '@/hooks/use-trash'
import { cn } from '@/lib/utils'
import { TrashItem } from '@/lib/trpc'

export function RecycleBinPage(): ReactNode {
  const { query, items, restore, hardDelete, emptyTrash } = useTrash()
  const [actionId, setActionId] = useState<string | null>(null)

  // 🔥 Логика группировки
  const groupedItems = useMemo(() => {
    const categories = items.filter((i) => i.type === 'category')
    const snippets = items.filter((i) => i.type === 'snippet')

    const nestedSnippetIds = new Set<number>()

    // 1. Собираем группы
    const groups = categories.map((cat) => {
      const children = snippets.filter((s) => s.categoryId === cat.id)
      children.forEach((c) => nestedSnippetIds.add(c.id))
      return { ...cat, children }
    })

    // 2. Сниппеты без удаленной папки (удалены поодиночке)
    const standalone = snippets.filter((s) => !nestedSnippetIds.has(s.id))

    // 3. Соединяем и сортируем по дате удаления
    return [...groups, ...standalone].sort((a, b) => {
      const timeA = a.deletedAt ? new Date(a.deletedAt).getTime() : 0
      const timeB = b.deletedAt ? new Date(b.deletedAt).getTime() : 0

      return timeB - timeA
    })
  }, [items])

  const handleAction = async (id: string, callback: () => Promise<unknown>) => {
    setActionId(id)
    try {
      await callback()
    } finally {
      setActionId(null)
    }
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-background h-full font-sans">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 px-8 py-6 border-b border-border/40 bg-background/95 backdrop-blur sticky top-0 z-30">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2 tracking-tight">
            <Trash2 className="h-6 w-6 text-muted-foreground/60" />
            Kosz
          </h2>
          <p className="text-sm text-muted-foreground mt-1 font-medium">
            {!query.isLoading && `${items.length} elementów do odzyskania.`}
          </p>
        </div>

        {items.length > 0 && (
          <Button
            variant="destructive"
            size="sm"
            onClick={() => handleAction('empty', emptyTrash)}
            disabled={!!actionId}
            className="gap-2 rounded-xl shadow-sm hover:shadow-destructive/20 transition-all"
          >
            {actionId === 'empty' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <AlertTriangle className="h-4 w-4" />
            )}
            Opróżnij kosz
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-6">
        <AsyncView
          query={query}
          isEmpty={items.length === 0}
          loader={<TrashLoader />}
          emptyFallback={<EmptyTrashState />}
        >
          <div className="space-y-6 max-w-5xl">
            {groupedItems.map((item) => (
              <div key={`${item.type}-${item.id}`} className="space-y-2">
                {/* Рендер основного элемента (Категория или Standalone Snippet) */}
                <TrashRow
                  item={item}
                  actionId={actionId}
                  onRestore={restore}
                  onDelete={hardDelete}
                  handleAction={handleAction}
                />

                {/* Рендер вложенных ребят */}
                {'children' in item && item.children.length > 0 && (
                  <div className="ml-6 pl-6 border-l-2 border-muted/50 space-y-2 mt-2">
                    {item.children.map((child) => (
                      <TrashRow
                        key={`child-${child.id}`}
                        item={{ ...child, type: 'snippet' }}
                        isChild
                        actionId={actionId}
                        onRestore={restore}
                        onDelete={hardDelete}
                        handleAction={handleAction}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </AsyncView>
      </div>
    </div>
  )
}

// --- Вспомогательный компонент строки ---
interface TrashRowProps {
  item: TrashItem
  isChild?: boolean
  actionId: string | null
  onRestore: (type: 'category' | 'snippet', id: number) => Promise<unknown>
  onDelete: (type: 'category' | 'snippet', id: number) => Promise<unknown>
  handleAction: (id: string, callback: () => Promise<unknown>) => void
}

function TrashRow({ item, isChild, actionId, onRestore, onDelete, handleAction }: TrashRowProps) {
  // 👈 Никаких any!
  const currentRestoreId = `restore-${item.type}-${item.id}`
  const currentDeleteId = `delete-${item.type}-${item.id}`

  return (
    <div
      className={cn(
        'group flex items-center gap-4 p-3 rounded-2xl transition-all duration-200 border',
        isChild
          ? 'bg-muted/30 border-transparent hover:border-border/60 scale-[0.98] origin-left'
          : 'bg-card border-border/40 shadow-sm hover:shadow-md hover:border-border/80'
      )}
    >
      {isChild && <CornerDownRight className="h-4 w-4 text-muted-foreground/40 shrink-0" />}

      <div
        className={cn(
          'flex items-center justify-center shrink-0 rounded-xl',
          isChild ? 'h-9 w-9 bg-background' : 'h-11 w-11 bg-secondary/70',
          item.type === 'snippet' ? 'text-blue-500' : 'text-amber-500'
        )}
      >
        {item.type === 'snippet' ? (
          <FileText className="h-5 w-5" />
        ) : (
          <Folder className="h-5 w-5" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p
          className={cn(
            'font-semibold text-foreground truncate',
            isChild ? 'text-sm' : 'text-base'
          )}
        >
          {item.name}
        </p>
        <div className="flex items-center gap-3 mt-0.5">
          <span className="text-[10px] uppercase font-bold tracking-tight text-muted-foreground/60">
            {item.type === 'snippet' ? 'Snippet' : 'Kategoria'}
          </span>
          <span className="text-[10px] text-muted-foreground/50">
            {/* 🔥 Еще один фикс: безопасный рендер даты */}
            {item.deletedAt ? new Date(item.deletedAt).toLocaleDateString() : 'Brak daty'}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleAction(currentRestoreId, () => onRestore(item.type, item.id))}
          disabled={!!actionId}
          className="h-8 rounded-lg text-xs hover:bg-emerald-500/10 hover:text-emerald-600"
        >
          {actionId === currentRestoreId ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <RotateCcw className="h-3.5 w-3.5 mr-1" />
          )}
          Przywróć
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleAction(currentDeleteId, () => onDelete(item.type, item.id))}
          disabled={!!actionId}
          className="h-8 w-8 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
        >
          {actionId === currentDeleteId ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Trash2 className="h-3.5 w-3.5" />
          )}
        </Button>
      </div>
    </div>
  )
}

function TrashLoader() {
  return (
    <div className="space-y-4 max-w-5xl">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="flex items-center gap-4 p-4 rounded-2xl bg-card border border-border/50"
        >
          <Skeleton className="h-10 w-10 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      ))}
    </div>
  )
}

function EmptyTrashState() {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center">
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-primary/5 blur-2xl rounded-full" />
        <div className="relative flex items-center justify-center h-24 w-24 rounded-3xl bg-secondary/50 border border-border/50">
          <Trash2 className="h-12 w-12 text-muted-foreground/40" />
        </div>
      </div>
      <h3 className="text-xl font-bold text-foreground mb-2">Kosz jest pusty</h3>
      <p className="text-muted-foreground max-w-[280px] text-sm leading-relaxed">
        Wszystkie usunięte snippety и kategorie pojawią się tutaj. Możesz je przywrócić w любой
        момент.
      </p>
    </div>
  )
}
