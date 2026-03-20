import { useEffect, useState } from 'react'
import { useUpdateStore } from '@/store/updateStore'
import { Button } from '@/components/ui/button'
import { Download, CheckCircle, Loader2 } from 'lucide-react'

// 🔥 Убрали пропсы
export function SettingsPage() {
  const { status, progress, checkForUpdates, downloadUpdate, installUpdate } = useUpdateStore()

  // 🔥 Добавили локальный стейт для версии
  const [currentVersion, setCurrentVersion] = useState('Ładowanie...')

  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      window.api &&
      typeof window.api.getAppVersion === 'function'
    ) {
      window.api.getAppVersion().then(setCurrentVersion)
    } else {
      setCurrentVersion('1.0.0 (Web)')
    }
  }, [])

  return (
    <div className="flex flex-col space-y-4 p-4 border rounded-xl bg-card">
      <div>
        <h3 className="text-lg font-semibold">O aplikacji</h3>
        <p className="text-sm text-muted-foreground">Wersja klienta: {currentVersion}</p>
      </div>

      <div className="pt-2">
        {status === 'idle' && (
          <Button variant="outline" onClick={checkForUpdates}>
            Sprawdź aktualizacje
          </Button>
        )}

        {status === 'checking' && (
          <Button variant="outline" disabled>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sprawdzanie...
          </Button>
        )}

        {status === 'available' && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-green-600 font-medium">Dostępna nowa wersja!</span>
            <Button onClick={downloadUpdate}>
              <Download className="mr-2 h-4 w-4" /> Pobierz
            </Button>
          </div>
        )}

        {status === 'downloading' && (
          <div className="space-y-2 w-full max-w-xs">
            <div className="flex justify-between text-xs font-medium text-muted-foreground">
              <span>Pobieranie aktualizacji...</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {status === 'ready' && (
          <Button onClick={installUpdate} className="bg-green-600 hover:bg-green-700 text-white">
            <CheckCircle className="mr-2 h-4 w-4" /> Uruchom ponownie i zainstaluj
          </Button>
        )}
      </div>
    </div>
  )
}
