import { defineConfig } from 'drizzle-kit'
import { join } from 'path'
import { homedir } from 'os'
import { APP_NAME, DB_FILE_NAME } from '../../packages/shared'

export const getSystemDbPath = (): string => {
  const platform = process.platform
  const home = homedir()

  let userDataPath = ''

  switch (platform) {
    case 'win32':
      userDataPath = join(process.env.APPDATA || join(home, 'AppData', 'Roaming'), APP_NAME)
      break
    case 'darwin':
      userDataPath = join(home, 'Library', 'Application Support', APP_NAME)
      break
    default: // linux
      userDataPath = join(process.env.XDG_CONFIG_HOME || join(home, '.config'), APP_NAME)
      break
  }

  return join(userDataPath, DB_FILE_NAME)
}


export default defineConfig({
  schema: '../../packages/shared/src/db/schema.ts', // Путь к вашему файлу схемы
  out: './drizzle', // Сюда упадут SQL файлы миграций
  dialect: 'sqlite',
  dbCredentials: {
    url: `file:${getSystemDbPath()}`,
  }
})
