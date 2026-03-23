import { ipcMain, app, BrowserWindow } from 'electron'
import { autoUpdater } from 'electron-updater'
import { isVersionOlder } from '../../renderer/src/lib/semver'

export const registerUpdateHandlers = async (): Promise<void> => {
  ipcMain.handle('get-app-version', () => {
    return app.getVersion()
  })

  const sendToWindow = (channel: string, data?: any) => {
    const win = BrowserWindow.getAllWindows()[0]
    if (win) win.webContents.send(channel, data)
  }

  autoUpdater.autoDownload = false
  autoUpdater.autoInstallOnAppQuit = true

  // Слушаем команды от React
  ipcMain.on('check-for-updates', () => {
    if (!app.isPackaged) {
      console.log('[UPDATER] Skipped in dev mode')
      sendToWindow('update-event', {
        type: 'error',
        message: 'Aktualizacje działają tylko w skompilowanej aplikacji (.exe)'
      })
      return
    }

    try {
      autoUpdater.checkForUpdates()
    } catch (err: any) {
      sendToWindow('update-event', { type: 'error', message: err.message })
    }
  })

  ipcMain.on('download-update', () => autoUpdater.downloadUpdate())
  ipcMain.on('install-update', () => autoUpdater.quitAndInstall())

  // Перехватываем ответ от GitHub
  autoUpdater.on('update-available', (info) => {
    const currentVersion = app.getVersion()
    const githubVersion = info.version

    if (!isVersionOlder(currentVersion, githubVersion)) {
      console.log(`[UPDATER] Versions are equal (${currentVersion} == ${githubVersion}). Ignoring.`)
      sendToWindow('update-event', { type: 'not-available' })
      return
    }

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
