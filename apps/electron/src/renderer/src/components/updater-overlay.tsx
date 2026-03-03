'use client'

import { useEffect, useState } from 'react'
import { DownloadCloud, CheckCircle2, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

export function UpdaterOverlay() {
  const [status, setStatus] = useState<'idle' | 'downloading' | 'ready'>('idle')
  const [progress, setProgress] = useState(0)
  const [version, setVersion] = useState('')

  useEffect(() => {
    // 1. Найдено обновление, начинаем качать
    window.api.onUpdateAvailable((v) => {
      setVersion(v)
      setStatus('downloading')
      setProgress(0)
    })

    // 2. Обновляем прогресс-бар
    window.api.onUpdateProgress((p) => {
      setProgress(p)
    })

    // 3. Скачано, ждем действий юзера
    window.api.onUpdateDownloaded((v) => {
      setVersion(v)
      setStatus('ready')
      setProgress(100)
    })
  }, [])

  if (status === 'idle') return null

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
      <div className="bg-card border border-border/50 shadow-lg rounded-2xl p-4 sm:p-5 w-[320px] flex flex-col gap-3 relative overflow-hidden">
        {/* Декоративный фон-свечение */}
        <div className="absolute -top-10 -right-10 w-24 h-24 bg-primary/10 rounded-full blur-2xl pointer-events-none" />

        {/* Заголовок */}
        <div className="flex items-start gap-3">
          <div
            className={cn(
              'p-2 rounded-xl shrink-0 transition-colors',
              status === 'downloading'
                ? 'bg-blue-500/10 text-blue-500'
                : 'bg-emerald-500/10 text-emerald-500'
            )}
          >
            {status === 'downloading' ? (
              <DownloadCloud className="h-5 w-5 animate-pulse" />
            ) : (
              <CheckCircle2 className="h-5 w-5" />
            )}
          </div>
          <div className="flex flex-col">
            <h4 className="text-sm font-semibold text-foreground">
              {status === 'downloading' ? 'Pobieranie aktualizacji...' : 'Aktualizacja gotowa!'}
            </h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              Wersja {version}{' '}
              {status === 'downloading' ? 'jest pobierana w tle.' : 'czeka na instalację.'}
            </p>
          </div>
        </div>

        {/* Прогресс-бар (показываем только во время загрузки) */}
        {status === 'downloading' && (
          <div className="flex flex-col gap-1.5 mt-1">
            <div className="flex justify-between text-[10px] font-medium text-muted-foreground px-0.5">
              <span>{Math.round(progress)}%</span>
            </div>
            {/* Используем shadcn Progress (или обычный div, если его нет) */}
            <Progress value={progress} className="h-1.5 w-full bg-secondary" />
          </div>
        )}

        {/* Кнопка установки (появляется, когда скачалось) */}
        {status === 'ready' && (
          <Button
            className="w-full mt-1 gap-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-sm"
            onClick={() => window.api.installUpdate()}
          >
            <RefreshCw className="h-4 w-4" />
            Uruchom ponownie
          </Button>
        )}
      </div>
    </div>
  )
}
