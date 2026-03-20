import { registerUpdateHandlers } from './ipc/update'

export const registerIpcHandlers = (): void => {
  registerUpdateHandlers()
}
