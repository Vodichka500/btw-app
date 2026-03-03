import { ipcMain } from 'electron'
import { registerCategoryHandlers } from './ipc/categories'
import { registerSnippetHandlers } from './ipc/snippets'
import { registerTrashHandlers } from './ipc/trash'
import { registerAlfaCrmIpcHandlers } from './ipc/alfa-crm'
import { registerScheduleHandlers } from './ipc/schedule'

export const registerIpcHandlers = (): void => {
  // Ping/Pong (оставим здесь, как базовую проверку)
  ipcMain.handle('ping', async () => {
    console.log('pong')
  })

  // Регистрируем модули
  registerCategoryHandlers()
  registerSnippetHandlers()
  registerTrashHandlers()
  registerAlfaCrmIpcHandlers()
  registerScheduleHandlers()
}
