import { ipcMain, app, BrowserWindow } from 'electron'
import { autoUpdater } from 'electron-updater'
import { is } from '@electron-toolkit/utils'

export const registerUpdateHandlers = async (): Promise<void> => {
  // 1. Всегда возвращаем текущую версию (работает и в DEV, и в PROD)
  ipcMain.handle('get-app-version', () => {
    return app.getVersion()
  })

  // Утилита для отправки событий в React
  const sendToWindow = (channel: string, data?: any) => {
    const win = BrowserWindow.getAllWindows()[0]
    if (win) win.webContents.send(channel, data)
  }

  // ==========================================
  // 🛠 РЕЖИМ РАЗРАБОТКИ (СИМУЛЯТОР)
  // ==========================================
  if (is.dev) {
    console.log('[DEV] Update Simulator Enabled')
    autoUpdater.autoDownload = false
    autoUpdater.autoInstallOnAppQuit = false

    ipcMain.on('check-for-updates', () => {
      console.log('[DEV] Checking for updates...')
      // Имитируем запрос к серверу (задержка 1.5 сек)
      setTimeout(() => {
        sendToWindow('update-event', { type: 'available' })
      }, 1500)
    })

    ipcMain.on('download-update', () => {
      console.log('[DEV] Downloading update...')
      let progress = 0

      // Имитируем скачивание (по 10% каждые полсекунды)
      const interval = setInterval(() => {
        progress += 10
        sendToWindow('update-event', { type: 'progress', percent: progress })

        if (progress >= 100) {
          clearInterval(interval)
          // Даем паузу перед тем как сказать, что всё готово
          setTimeout(() => {
            sendToWindow('update-event', { type: 'downloaded' })
          }, 800)
        }
      }, 500)
    })

    ipcMain.on('install-update', () => {
      console.log('[DEV] Quitting and installing...')
      app.quit() // В DEV просто закроет окно
    })

    return // 🛑 ВАЖНО: Выходим отсюда, чтобы не привязать реальные события autoUpdater
  }

  // ==========================================
  // 🚀 ПРОДАКШЕН РЕЖИМ (РЕАЛЬНЫЙ GITHUB)
  // ==========================================

  // Мы сами контролируем скачивание через UI!
  autoUpdater.autoDownload = false
  autoUpdater.autoInstallOnAppQuit = true

  // Слушаем команды от React и передаем их реальному апдейтеру
  ipcMain.on('check-for-updates', () => autoUpdater.checkForUpdates())
  ipcMain.on('download-update', () => autoUpdater.downloadUpdate())
  ipcMain.on('install-update', () => autoUpdater.quitAndInstall())

  // Слушаем события от реального апдейтера и кидаем в React
  autoUpdater.on('update-available', () => {
    sendToWindow('update-event', { type: 'available' })
  })

  autoUpdater.on('update-not-available', () => {
    sendToWindow('update-event', { type: 'not-available' })
  })

  autoUpdater.on('download-progress', (progressObj) => {
    sendToWindow('update-event', { type: 'progress', percent: progressObj.percent })
  })

  autoUpdater.on('update-downloaded', () => {
    sendToWindow('update-event', { type: 'downloaded' })
  })

  autoUpdater.on('error', (err) => {
    sendToWindow('update-event', { type: 'error', message: err.message })
  })
}
