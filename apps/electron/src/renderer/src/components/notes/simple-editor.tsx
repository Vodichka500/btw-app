import { ReactNode, useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface SimpleEditorProps {
  className?: string
}

export function SimpleEditor({ className }: SimpleEditorProps): ReactNode {
  const [content, setContent] = useState('')

  // Загружаем при старте
  useEffect(() => {
    const saved = localStorage.getItem('simple-notes-content') || ''
    setContent(saved)
  }, [])

  // Сохраняем при изменении
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newVal = e.target.value
    setContent(newVal)
    localStorage.setItem('simple-notes-content', newVal)
  }

  return (
    <textarea
      className={cn(
        "w-full h-full resize-none bg-background text-foreground p-6 outline-none text-base leading-relaxed placeholder:text-muted-foreground",
        className
      )}
      placeholder="Wpisz tutaj swoje notatki..."
      value={content}
      onChange={handleChange}
      spellCheck={false}
    />
  )
}
