'use client'

import React, { useState, useMemo, useCallback } from 'react'
import { Star, Copy, Pencil, Trash2, MoreVertical, Check, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

import type { DeletedSnippet, SnippetNode } from '@/lib/trpc'


interface VariableItem {
  key: string
  hint?: string
}

interface SnippetCardProps {
  snippet: SnippetNode
  onToggleFavorite: (id: number) => Promise<void>
  onEdit: (snippet: SnippetNode) => void
  onDelete: (id: number) => Promise<DeletedSnippet>
}


// Хелпер для определения контрастности текста
// Возвращает true, если цвет темный (нужен белый текст)
function isDarkColor(hex?: string | null): boolean {
  if (!hex) return false
  const c = hex.substring(1) // strip #
  const rgb = parseInt(c, 16) // convert rrggbb to decimal
  const r = (rgb >> 16) & 0xff // extract red
  const g = (rgb >> 8) & 0xff // extract green
  const b = (rgb >> 0) & 0xff // extract blue

  // Формула люминесценции (стандарт W3C)
  const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b
  return luma < 128
}

export function SnippetCard({
  snippet,
  onToggleFavorite,
  onEdit,
  onDelete
}: SnippetCardProps): React.ReactNode {
  const variables: VariableItem[] = useMemo(() => {
    if (!snippet.variables) return []
    if (Array.isArray(snippet.variables)) return snippet.variables

    try {
      let parsed

      if (typeof snippet.variables === 'string') {
        parsed = JSON.parse(snippet.variables)
      } else {
        parsed = snippet.variables
      }
      return Array.isArray(parsed) ? parsed : []
    } catch (e) {
      console.error('Failed to parse variables:', e)
      return []
    }
  }, [snippet.variables, snippet.id])

  const [values, setValues] = useState<Record<string, string>>({})
  const [copied, setCopied] = useState<boolean>(false)
  const [showErrors, setShowErrors] = useState<boolean>(false)

  const hasVariables = variables.length > 0
  const allFilled = variables.every((v) => (values[v.key] || '').trim() !== '')
  const canCopy = !hasVariables || allFilled

  // Определяем цвета карточки
  const bgColor = snippet.color || '#FFFFFF'
  const isDark = isDarkColor(bgColor)
  const isDefaultWhite = bgColor.toUpperCase() === '#FFFFFF'

  // Классы для адаптации текста под фон
  const textColorClass = isDark ? 'text-white' : 'text-card-foreground'
  const mutedTextClass = isDark ? 'text-white/70' : 'text-muted-foreground'
  const borderColorClass = isDark ? 'border-white/20' : 'border-border/60'
  const inputBgClass = isDark
    ? 'bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-white/50'
    : 'bg-background border-border/60'
  const hoverBgClass = isDark ? 'hover:bg-white/10' : 'hover:bg-muted/30'

  const generateText = useCallback(
    (forPreview: boolean = false): string => {
      let text = snippet.body
      for (const v of variables) {
        const val = values[v.key] || (forPreview ? `{{${v.key}}}` : '')
        text = text.replace(new RegExp(`\\{\\{${v.key}\\}\\}`, 'g'), val)
      }
      return text
    },
    [snippet.body, variables, values]
  )

  const handleCopy = async (): Promise<void> => {
    if (!canCopy) {
      setShowErrors(true)
      toast.error('Proszę uzupełnić wszystkie zmienne przed skopiowaniem.')
      return
    }

    try {
      const textToCopy = generateText(false)
      await navigator.clipboard.writeText(textToCopy)

      setCopied(true)
      toast.success('Skopiowano do schowka!')

      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Copy failed', err)
      toast.error('Nie udało się skopiować do schowka.')
    }
  }

  return (
    <div
      className={cn(
        'group flex flex-col rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden border',
        borderColorClass,
        // Если цвет белый, используем стандартный класс bg-card, иначе инлайновый стиль
        isDefaultWhite ? 'bg-card' : ''
      )}
      style={{
        backgroundColor: !isDefaultWhite ? bgColor : undefined
      }}
    >
      {/* Card Header */}
      <div className="flex items-start justify-between px-5 pt-5 pb-3">
        <div className="flex flex-col gap-1.5 min-w-0 pr-2">
          <div className="flex items-center gap-2">
            <h3
              className={cn('font-semibold text-base truncate', textColorClass)}
              title={snippet.title}
            >
              {snippet.title}
            </h3>
            {snippet.favorite && (
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400 shrink-0" />
            )}
          </div>

          {snippet.category && (
            <div className="flex">
              <span
                className={cn(
                  'text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md font-medium truncate max-w-[150px]',
                  isDark ? 'bg-white/20 text-white' : 'bg-secondary text-secondary-foreground'
                )}
              >
                {snippet.category.name}
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              'h-8 w-8 rounded-xl',
              isDark
                ? 'text-white/70 hover:text-white hover:bg-white/20'
                : 'text-muted-foreground hover:text-amber-500 hover:bg-amber-50'
            )}
            onClick={() => onToggleFavorite(snippet.id)}
            title={snippet.favorite ? 'Usuń z ulubionych' : 'Dodaj do ulubionych'}
          >
            <Star className={cn('h-4 w-4', snippet.favorite && 'fill-current text-current')} />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  'h-8 w-8 rounded-xl',
                  isDark
                    ? 'text-white/70 hover:text-white hover:bg-white/20'
                    : 'text-muted-foreground'
                )}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40 rounded-xl">
              <DropdownMenuItem onClick={() => onEdit(snippet)}>
                <Pencil className="h-4 w-4 mr-2" />
                Edytuj
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(snippet.id)}
                className="text-destructive focus:text-destructive focus:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Usuń
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Variable Inputs Section */}
      {hasVariables && (
        <div
          className={cn(
            'flex flex-col gap-2 w-full px-5 py-3 border-y space-y-3',
            borderColorClass,
            isDark ? 'bg-black/10' : 'bg-muted/50'
          )}
        >
          {variables.map((v) => {
            const isEmpty = showErrors && !(values[v.key] || '').trim()
            return (
              <div key={v.key} className="flex items-center gap-3">
                <label
                  className={cn('text-xs font-semibold w-1/3 text-right truncate', mutedTextClass)}
                  title={v.hint || v.key}
                >
                  {v.hint || v.key}
                </label>

                <div className="relative flex-1">
                  <Input
                    type="text"
                    placeholder="Wartość..."
                    value={values[v.key] || ''}
                    onChange={(e) =>
                      setValues((prev) => ({
                        ...prev,
                        [v.key]: e.target.value
                      }))
                    }
                    className={cn(
                      'h-8 text-sm rounded-lg shadow-sm transition-all',
                      inputBgClass,
                      isEmpty
                        ? 'border-destructive ring-1 ring-destructive/20 pr-8'
                        : isDark
                          ? 'hover:border-white/70'
                          : 'hover:border-primary/30'
                    )}
                  />
                  {isEmpty && (
                    <AlertCircle className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-destructive pointer-events-none" />
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Preview Area (Clickable to Copy) */}
      <div
        className={cn(
          'px-5 py-4 flex-1 flex flex-col min-h-[100px] relative transition-colors group/preview',
          canCopy ? cn('cursor-pointer', hoverBgClass) : 'cursor-not-allowed opacity-70'
        )}
        onClick={handleCopy}
      >
        <div className="flex justify-between items-center mb-2">
          <p
            className={cn(
              'text-[10px] font-bold uppercase tracking-widest',
              isDark ? 'text-white/60' : 'text-muted-foreground/70'
            )}
          >
            Podgląd
          </p>
          {/* Copy Indicator */}
          <div className="flex items-center gap-1.5 text-xs font-medium transition-all duration-300">
            {copied ? (
              <div
                className={cn(
                  'flex items-center gap-1 animate-in fade-in zoom-in-95',
                  isDark ? 'text-emerald-300' : 'text-emerald-600'
                )}
              >
                <span>Skopiowano</span>
                <Check className="h-3.5 w-3.5" />
              </div>
            ) : (
              <div
                className={cn(
                  'flex items-center gap-1 opacity-0 group-hover/preview:opacity-100 transition-opacity',
                  isDark ? 'text-white/60' : 'text-muted-foreground/60'
                )}
              >
                <span>Kliknij, aby skopiować</span>
                <Copy className="h-3.5 w-3.5" />
              </div>
            )}
          </div>
        </div>

        <div
          className={cn(
            'flex-1 rounded-xl p-3 border relative transition-colors',
            isDark ? 'bg-white/10 border-white/10' : 'bg-muted/20 border-border/30'
          )}
        >
          <pre
            className={cn(
              'text-sm whitespace-pre-wrap font-mono leading-relaxed break-words',
              isDark ? 'text-white/90' : 'text-foreground/90'
            )}
          >
            {generateText(true)}
          </pre>
        </div>
      </div>
    </div>
  )
}
