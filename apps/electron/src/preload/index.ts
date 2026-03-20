import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', {
      // Вызываем ipcRenderer из импорта electron
      getAppVersion: () => ipcRenderer.invoke('get-app-version'),
      checkForUpdates: () => ipcRenderer.send('check-for-updates'),
      downloadUpdate: () => ipcRenderer.send('download-update'),
      installUpdate: () => ipcRenderer.send('install-update'),

      // Слушатель событий от апдейтера
      onUpdateEvent: (callback) => {
        ipcRenderer.removeAllListeners('update-event')
        ipcRenderer.on('update-event', (_event, data) => callback(data))
      }
    })
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = {
    getAppVersion: () => ipcRenderer.invoke('get-app-version')
  }
}
