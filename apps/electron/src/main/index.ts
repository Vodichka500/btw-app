import { app, shell, BrowserWindow, globalShortcut, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { registerIpcHandlers } from './ipc'
import log from 'electron-log'
import { autoUpdater } from 'electron-updater'

let mainWindow: BrowserWindow | null = null

autoUpdater.logger = log
;(autoUpdater.logger as any).transports.file.level = 'info'

autoUpdater.autoDownload = true

export function setupAutoUpdater(mainWindow: Electron.BrowserWindow) {
  // 1. Проверяем обновления при запуске
  // Заворачиваем в таймаут, чтобы не тормозить старт приложения
  setTimeout(() => {
    autoUpdater.checkForUpdatesAndNotify()
  }, 3000)

  // 2. Слушаем события апдейтера и отправляем их на фронтенд (React)
  autoUpdater.on('checking-for-update', () => {
    mainWindow.webContents.send('updater:checking')
  })

  autoUpdater.on('update-available', (info) => {
    mainWindow.webContents.send('updater:available', info.version)
  })

  autoUpdater.on('update-not-available', () => {
    mainWindow.webContents.send('updater:not-available')
  })

  autoUpdater.on('error', (err) => {
    mainWindow.webContents.send('updater:error', err.message)
  })

  autoUpdater.on('download-progress', (progressObj) => {
    // Отправляем процент загрузки на фронт (можно показать красивый прогресс-бар)
    mainWindow.webContents.send('updater:progress', progressObj.percent)
  })

  autoUpdater.on('update-downloaded', (info) => {
    mainWindow.webContents.send('updater:downloaded', info.version)
  })

  // 3. Хендлер для ручного запуска установки с фронтенда
  ipcMain.handle('updater:install', () => {
    autoUpdater.quitAndInstall(false, true)
  })
}

function createWindow(): void {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    title: 'BTW App',
    icon: icon,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  setupAutoUpdater(mainWindow)

  mainWindow.on('ready-to-show', () => {
    mainWindow!.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}



// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.kamisarau.btwapp')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  //ipcMain.on('ping', () => console.log('pong'))
  registerIpcHandlers()

  createWindow()

  const shortcut =
    process.platform === 'darwin'
      ? 'Command+Shift+Y'
      : 'Ctrl+Alt+Y'

  const success = globalShortcut.register(shortcut, () => {
    if (!mainWindow) {
      createWindow()
      return
    }

    if (mainWindow.isMinimized()) {
      mainWindow.restore()
    }

    if (!mainWindow.isVisible()) {
      mainWindow.show()
    }

    mainWindow.focus()
  })

  if (!success) {
    console.log('❌ Не удалось зарегистрировать хоткей')
  }

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
app.on('will-quit', () => {
  globalShortcut.unregisterAll()
})
