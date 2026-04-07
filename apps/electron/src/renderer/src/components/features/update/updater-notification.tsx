import { useEffect } from 'react'
import { toast } from 'sonner'
import { useUpdateStore } from '@/store/updateStore'
import { Button } from '@/components/shared/ui/button'
import { Download, RefreshCw } from 'lucide-react'

export function UpdaterNotification() {
  const { status, progress, isMandatory, downloadUpdate, installUpdate } = useUpdateStore()

  useEffect(() => {
    // Если обновление принудительное, тост не показываем (работает красный экран)
    if (isMandatory) return

    const toastId = 'app-update-toast' // Фиксированный ID, чтобы тост обновлялся, а не дублировался

    if (status === 'available') {
      toast(
        <div className="flex flex-col gap-3 w-full">
          <div>
            <h3 className="font-semibold text-sm">Dostępna aktualizacja</h3>
            <p className="text-xs text-muted-foreground">
              Czy chcesz pobrać nową wersję aplikacji?
            </p>
          </div>
          <div className="flex gap-2 justify-end mt-1">
            {/* Кнопка закрытия тоста */}
            <Button variant="outline" size="sm" onClick={() => toast.dismiss(toastId)}>
              Później
            </Button>
            {/* Запускаем скачивание */}
            <Button size="sm" onClick={downloadUpdate}>
              <Download className="h-4 w-4 mr-2" /> Pobierz
            </Button>
          </div>
        </div>,
        { duration: Number.POSITIVE_INFINITY, id: toastId, unstyled: false }
      )
    } else if (status === 'downloading') {
      // Тост автоматически обновится, так как ID совпадает
      toast(
        <div className="flex flex-col gap-2 w-full">
          <h3 className="font-semibold text-sm">Pobieranie aktualizacji...</h3>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Postęp:</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>,
        { duration: Number.POSITIVE_INFINITY, id: toastId }
      )
    } else if (status === 'ready') {
      toast(
        <div className="flex flex-col gap-3 w-full">
          <div>
            <h3 className="font-semibold text-sm text-green-600">Aktualizacja gotowa</h3>
            <p className="text-xs text-muted-foreground">
              Aplikacja zostanie uruchomiona ponownie.
            </p>
          </div>
          <div className="flex gap-2 justify-end mt-1">
            <Button variant="outline" size="sm" onClick={() => toast.dismiss(toastId)}>
              Później
            </Button>
            <Button
              size="sm"
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={installUpdate}
            >
              <RefreshCw className="h-4 w-4 mr-2" /> Zainstaluj
            </Button>
          </div>
        </div>,
        { duration: Number.POSITIVE_INFINITY, id: toastId }
      )
    }
  }, [status, progress, isMandatory, downloadUpdate, installUpdate])

  return null
}
