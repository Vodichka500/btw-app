import { AlertTriangle, Download, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useUpdateStore } from '@/store/updateStore'

export function HardUpdateScreen() {
  const { status, progress, downloadUpdate, installUpdate } = useUpdateStore()

  return (
    <div className="flex items-center justify-center w-screen h-screen bg-background text-foreground fixed inset-0 z-50">
      <div className="max-w-md w-full p-8 flex flex-col items-center text-center space-y-6">
        <div className="h-20 w-20 bg-destructive/10 rounded-full flex items-center justify-center mb-2">
          <AlertTriangle className="h-10 w-10 text-destructive" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">Wymagana aktualizacja</h1>
          <p className="text-muted-foreground text-sm">
            Twoja wersja aplikacji jest przestarzała i nie jest już obsługiwana przez serwer.
            Zaktualizuj aplikację, aby kontynuować pracę.
          </p>
        </div>

        {status === 'idle' || status === 'available' ? (
          <Button onClick={downloadUpdate} className="w-full h-12 text-md gap-2">
            <Download className="h-5 w-5" /> Pobierz aktualizację
          </Button>
        ) : status === 'downloading' ? (
          <div className="w-full space-y-3">
            <div className="flex justify-between text-sm font-medium">
              <span>Pobieranie...</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        ) : status === 'ready' ? (
          <Button
            onClick={installUpdate}
            className="w-full h-12 text-md gap-2 bg-green-600 hover:bg-green-700 text-white"
          >
            <RefreshCw className="h-5 w-5" /> Uruchom ponownie i zainstaluj
          </Button>
        ) : null}
      </div>
    </div>
  )
}
