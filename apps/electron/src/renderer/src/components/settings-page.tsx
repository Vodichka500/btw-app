import { useEffect, useState } from 'react'
import { useUpdateStore } from '@/store/updateStore'
import { Button } from '@/components/ui/button'
import { Download, CheckCircle, Loader2, Settings2, MonitorUp, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

export function SettingsPage() {
  // Локальный стейт для переключения вкладок
  const [activeTab, setActiveTab] = useState<'general' | 'updates'>('updates')

  return (
    <div className="flex-1 overflow-y-auto bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold tracking-tight mb-8">Ustawienia aplikacji</h1>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Левое меню (Навигация) */}
          <div className="w-full md:w-64 space-y-2 shrink-0">
            <button
              onClick={() => setActiveTab('general')}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-xl transition-colors',
                activeTab === 'general'
                  ? 'bg-secondary text-secondary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
              )}
            >
              <Settings2 className="w-4 h-4" />
              Ogólne
            </button>
            <button
              onClick={() => setActiveTab('updates')}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-xl transition-colors',
                activeTab === 'updates'
                  ? 'bg-secondary text-secondary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
              )}
            >
              <MonitorUp className="w-4 h-4" />
              Aktualizacje
            </button>
          </div>

          {/* Контент табов */}
          <div className="flex-1">
            {activeTab === 'general' && <GeneralSettingsTab />}
            {activeTab === 'updates' && <UpdateSettingsTab />}
          </div>
        </div>
      </div>
    </div>
  )
}

// Заглушка для общих настроек (на будущее)
function GeneralSettingsTab() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Ogólne ustawienia</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Tutaj pojawią się opcje wyglądu i zachowania aplikacji.
        </p>
      </div>
      <div className="p-6 border rounded-2xl bg-card text-center text-muted-foreground text-sm">
        Brak ustawień do wyświetlenia
      </div>
    </div>
  )
}

// 🔥 Отрефакторенный компонент обновлений
function UpdateSettingsTab() {
  const { status, progress, errorMsg, checkForUpdates, downloadUpdate, installUpdate } =
    useUpdateStore()
  const [currentVersion, setCurrentVersion] = useState('Ładowanie...')

  useEffect(() => {
    if (typeof window !== 'undefined' && window.api?.getAppVersion) {
      window.api.getAppVersion().then(setCurrentVersion)
    } else {
      setCurrentVersion('1.0.0 (Web)')
    }
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Aktualizacje</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Zarządzaj wersją aplikacji i pobieraj nowe aktualizacje.
        </p>
      </div>

      <div className="flex flex-col space-y-6 p-6 border rounded-2xl bg-card shadow-sm">
        <div>
          <h3 className="text-base font-semibold">Obecna wersja</h3>
          <p className="text-2xl font-mono mt-1 text-primary">{currentVersion}</p>
        </div>

        <div className="pt-4 border-t border-border/50">
          {(status === 'idle' || status === 'up-to-date') && (
            <div className="space-y-4">
              {status === 'up-to-date' && (
                <p className="text-sm text-emerald-600 font-medium flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" /> Masz najnowszą wersję aplikacji.
                </p>
              )}
              <Button variant="outline" onClick={checkForUpdates} className="rounded-xl">
                Sprawdź aktualizacje
              </Button>
            </div>
          )}

          {status === 'checking' && (
            <Button variant="outline" disabled className="rounded-xl">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Szukanie aktualizacji...
            </Button>
          )}

          {status === 'available' && (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl dark:bg-emerald-500/10 dark:border-emerald-500/20">
                <span className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                  🎉 Dostępna jest nowa wersja!
                </span>
              </div>
              <Button
                onClick={downloadUpdate}
                className="rounded-xl bg-primary text-primary-foreground"
              >
                <Download className="mr-2 h-4 w-4" /> Pobierz aktualizację
              </Button>
            </div>
          )}

          {status === 'downloading' && (
            <div className="space-y-3 w-full max-w-sm">
              <div className="flex justify-between text-sm font-medium text-muted-foreground">
                <span>Pobieranie plików...</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {status === 'ready' && (
            <div className="space-y-4">
              <p className="text-sm text-emerald-600 font-medium">
                Aktualizacja gotowa do instalacji!
              </p>
              <Button
                onClick={installUpdate}
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl"
              >
                <CheckCircle className="mr-2 h-4 w-4" /> Uruchom ponownie i zaktualizuj
              </Button>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-4">
              <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-destructive">Błąd aktualizacji</h4>
                  <p className="text-sm text-destructive/80 mt-1">{errorMsg || 'Nieznany błąd'}</p>
                </div>
              </div>
              <Button variant="outline" onClick={checkForUpdates} className="rounded-xl">
                Spróbuj ponownie
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
