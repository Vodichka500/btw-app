import { useEffect } from 'react'
import { toast } from 'sonner'

export function UpdaterNotification() {
  useEffect(() => {
    // Приложение нашло новую версию и начало скачивать
    window.api.onUpdateAvailable((version) => {
      toast.info(`Znaleziono nową wersję ${version}. Pobieranie w tle...`, {
        duration: 5000
      })
    })

    // Можно раскомментить, если хочешь показывать прогресс-бар (обычно это лишний шум)
    /*
    window.api.onUpdateProgress((percent) => {
      console.log(`Downloading: ${Math.round(percent)}%`)
    })
    */

    // Обновление скачано и готово к установке
    window.api.onUpdateDownloaded((version) => {
      toast.success(`Aktualizacja ${version} jest gotowa!`, {
        duration: 20000, // Держим долго
        action: {
          label: 'Zainstaluj i uruchom ponownie',
          onClick: () => {
            window.api.installUpdate() // Триггерим рестарт и установку
          }
        }
      })
    })
  }, [])

  return null // Это "невидимый" компонент логики
}
