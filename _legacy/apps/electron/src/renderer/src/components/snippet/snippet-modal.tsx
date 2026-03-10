'use client'

import React, { useState, useEffect } from 'react'
import { Loader2, Plus, Trash2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ColorPicker } from '@/components/color-picker' // Импорт твоего пикера
import type { Category, Snippet } from '@btw-app/shared'

interface VariableItem {
  key: string
  hint: string
}

// Обновили интерфейс данных
interface SnippetModalData {
  title: string
  body: string
  variables: VariableItem[]
  categoryId: number
  favorite: boolean
  color: string // Добавили цвет
}

interface SnippetModalProps {
  open: boolean
  onClose: () => void
  onSave: (data: SnippetModalData) => Promise<void>
  editSnippet?: Snippet | null
  flatCategories: Category[]
  defaultCategoryId?: number | null
}

export function SnippetModal({
  open,
  onClose,
  onSave,
  editSnippet,
  flatCategories,
  defaultCategoryId
}: SnippetModalProps): React.ReactNode {
  const [title, setTitle] = useState<string>('')
  const [body, setBody] = useState<string>('')
  const [categoryId, setCategoryId] = useState<string>('')
  const [variables, setVariables] = useState<VariableItem[]>([])
  const [color, setColor] = useState<string>('#FFFFFF') // Стейт цвета
  const [saving, setSaving] = useState<boolean>(false)

  useEffect(() => {
    if (open) {
      if (editSnippet) {
        setTitle(editSnippet.title)
        setBody(editSnippet.body)
        setCategoryId(String(editSnippet.categoryId))
        setColor(editSnippet.color || '#FFFFFF') // Загружаем цвет
        try {
          const parsed = JSON.parse(editSnippet.variables || '[]')
          setVariables(Array.isArray(parsed) ? parsed : [])
        } catch {
          setVariables([])
        }
      } else {
        setTitle('')
        setBody('')
        setCategoryId(flatCategories.length > 0 ? String(flatCategories[0].id) : '')
        setColor('#FFFFFF')
        setVariables([])

        if (defaultCategoryId) {
          setCategoryId(String(defaultCategoryId))
        } else if (flatCategories.length > 0) {
          setCategoryId(String(flatCategories[0].id))
        } else {
          setCategoryId('')
        }
      }
    }
  }, [open, editSnippet, flatCategories])

  const addVariable = (): void => {
    setVariables((prev) => [...prev, { key: '', hint: '' }])
  }

  const removeVariable = (index: number): void => {
    setVariables((prev) => prev.filter((_, i) => i !== index))
  }

  const updateVariable = (index: number, field: keyof VariableItem, value: string): void => {
    setVariables((prev) => prev.map((v, i) => (i === index ? { ...v, [field]: value } : v)))
  }

  const handleSave = async (): Promise<void> => {
    if (!title.trim() || !body.trim() || !categoryId) return

    setSaving(true)
    try {
      const cleanVars = variables.filter((v) => v.key.trim() !== '')

      await onSave({
        title: title.trim(),
        body: body.trim(),
        variables: cleanVars,
        categoryId: Number(categoryId),
        favorite: editSnippet?.favorite ?? false,
        color: color // Отправляем цвет
      })
      onClose()
    } catch (error) {
      console.error('Failed to save snippet:', error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl text-foreground">
        <DialogHeader>
          <DialogTitle>{editSnippet ? 'Edit Snippet' : 'Create Snippet'}</DialogTitle>
          <DialogDescription>
            {editSnippet
              ? 'Modify your snippet details below.'
              : 'Add a new text snippet with optional dynamic variables.'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          {/* Row 1: Title, Category, Color */}
          <div className="flex w-full gap-3 items-end">
            {/* Title */}
            <div className="flex flex-col gap-1.5 flex-[2]">
              <Label htmlFor="snip-title">Title</Label>
              <Input
                id="snip-title"
                type="text"
                placeholder="e.g. Welcome Email"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="rounded-xl"
              />
            </div>

            {/* Category */}
            <div className="flex flex-col gap-1.5 flex-1">
              <Label>Category</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {flatCategories.map((cat) => (
                    <SelectItem key={cat.id} value={String(cat.id)}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Color Picker Popover */}
            <div className="flex flex-col gap-1.5 shrink-0">
              <Label className="text-xs">Color</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-10 h-10 rounded-xl p-0 border overflow-hidden shadow-sm"
                    style={{ backgroundColor: color }}
                    title="Pick a color"
                  >
                    {/* Если цвет белый или очень светлый, показываем иконку для контраста */}
                    <span className="sr-only">Pick color</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-4 rounded-xl" align="end">
                  <div className="space-y-3">
                    <h4 className="font-medium leading-none">Snippet Color</h4>
                    <p className="text-xs text-muted-foreground">
                      Select a background color for the card.
                    </p>
                    <ColorPicker value={color} onChange={setColor} />
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Body */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center ">
              <Label htmlFor="snip-body">Body</Label>
              <span className="text-xs text-muted-foreground">
                Use <code className="bg-muted px-1 py-0.5 rounded text-[10px]">{'{{key}}'}</code>{' '}
                for variables
              </span>
            </div>
            <Textarea
              id="snip-body"
              placeholder={'Hello {{name}},\n\nWelcome to {{company}}!'}
              rows={6}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="rounded-xl resize-none font-mono text-sm leading-relaxed"
            />
          </div>

          {/* Variables */}
          <div className="flex flex-col gap-3 pt-4 border-t border-border/50">
            <div className="flex items-center justify-between">
              <Label>Variables</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addVariable}
                className="gap-1 h-7 text-xs rounded-lg bg-secondary/50 hover:bg-secondary border-dashed border-border"
              >
                <Plus className="h-3 w-3" />
                Add Variable
              </Button>
            </div>

            {variables.length === 0 && (
              <div className="text-center py-4 bg-muted/20 rounded-xl border border-dashed border-border/60">
                <p className="text-xs text-muted-foreground">
                  No variables defined. <br />
                  Variables allow you to fill in data when copying.
                </p>
              </div>
            )}

            <div className="space-y-2">
              {variables.map((v, i) => (
                <div
                  key={`var-${i}`}
                  className="flex items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-200"
                >
                  <div className="flex-1">
                    <Input
                      type="text"
                      placeholder="Key (e.g. name)"
                      value={v.key}
                      onChange={(e) => updateVariable(i, 'key', e.target.value)}
                      className="h-9 rounded-lg text-xs"
                    />
                  </div>
                  <div className="flex-1">
                    <Input
                      type="text"
                      placeholder="Hint (e.g. Client Name)"
                      value={v.hint || ''}
                      onChange={(e) => updateVariable(i, 'hint', e.target.value)}
                      className="h-9 rounded-lg text-xs"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeVariable(i)}
                    className="h-9 w-9 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="flex gap-2 sm:gap-0 mt-2">
          <Button variant="outline" onClick={onClose} disabled={saving} className="rounded-xl">
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!title.trim() || !body.trim() || !categoryId || saving}
            className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {editSnippet ? 'Update Snippet' : 'Create Snippet'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
