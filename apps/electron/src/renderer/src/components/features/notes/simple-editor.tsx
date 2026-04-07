'use client'

import { ReactNode, useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface SimpleEditorProps {
  className?: string
}

const STORAGE_KEY = 'simple-notes-content'

export function SimpleEditor({ className }: SimpleEditorProps): ReactNode {
  const [content, setContent] = useState('')
  const [isLoaded, setIsLoaded] = useState(false)

  // Загружаем при старте
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) || ''
    setContent(saved)
    setIsLoaded(true)
  }, [])

  // Сохраняем при изменении (сработает только после загрузки)
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, content)
    }
  }, [content, isLoaded])

  return (
    <textarea
      className={cn(
        'w-full h-full resize-none bg-background text-foreground p-6 outline-none text-base leading-relaxed placeholder:text-muted-foreground',
        className
      )}
      placeholder="Wpisz tutaj swoje notatki..."
      value={content}
      onChange={(e) => setContent(e.target.value)}
      spellCheck={false}
    />
  )
}
