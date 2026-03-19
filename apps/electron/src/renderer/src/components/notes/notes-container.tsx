'use client'

import { ReactNode, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Minimize2, Maximize2, X, ArrowLeft } from 'lucide-react'
import { SimpleEditor } from './simple-editor'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useUIStore } from '@/store/uiStore'

export function NotesContainer(): ReactNode {
  const { viewMode, isNotesFloating, toggleNotesMode, closeNotes } = useUIStore()

  const isFullScreen = viewMode === 'notes'
  const isVisible = isFullScreen || isNotesFloating

  // Блокировка скролла
  useEffect(() => {
    if (isVisible && isFullScreen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
  }, [isVisible, isFullScreen])

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="notes-container"
          initial={{ opacity: 0, height: 0, scale: 0.95 }}
          animate={{ opacity: 1, height: 'auto', scale: 1 }}
          exit={{ opacity: 0, height: 0, scale: 0.95 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className={cn(
            'bg-background border border-border shadow-2xl flex flex-col z-[100] overflow-hidden',
            isFullScreen
              ? 'absolute inset-0 w-full h-full rounded-none'
              : 'fixed bottom-6 right-6 w-[350px] h-[450px] rounded-xl min-w-[250px] min-h-[150px]'
          )}
        >
          {/* --- HEADER --- */}
          <div className="flex items-center justify-between px-4 h-12 shrink-0 border-b bg-muted/30 select-none">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground/80">
              {isFullScreen && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 mr-1"
                  onClick={toggleNotesMode}
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              )}
              <span className="font-semibold">Szybkie notatki</span>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:bg-background"
                onClick={toggleNotesMode}
              >
                {isFullScreen ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
              </Button>

              {!isFullScreen && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                  onClick={closeNotes}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* --- EDITOR BODY --- */}
          <div className="flex-1 min-h-0 bg-background flex flex-col pointer-events-auto">
            <SimpleEditor className="p-6 text-lg flex-1" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
