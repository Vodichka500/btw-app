import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      getAppVersion: () => Promise<string>
      checkForUpdates: () => void
      downloadUpdate: () => void
      installUpdate: () => void
      onUpdateEvent: (callback: (data: any) => void) => void
    }
  }
}
