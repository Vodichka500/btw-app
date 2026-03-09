import { app } from 'electron'
import { join } from 'path'
// Do not change absolute import paths here
import { initDb } from '../../../../../packages/shared/src/db/connect'
import * as schema from '@btw-app/shared'
import { seedDatabase } from './seed'
import { LibSQLDatabase } from 'drizzle-orm/libsql'

export type AppDatabase = LibSQLDatabase<typeof schema>
let db: AppDatabase | null = null
let dbInitPromise: Promise<AppDatabase> | null = null

export const getDb = async (): Promise<AppDatabase> => {
  // 1. Если база уже успешно создана и сохранена - отдаем сразу
  if (db) return db

  const userDataPath = app.getPath('userData')
  const dbPath = join(userDataPath, 'clippy.db')

  const migrationsFolder = app.isPackaged
    ? join(process.resourcesPath, 'drizzle')
    : join(app.getAppPath(), 'drizzle')

  try {
    // 2. Если процесс инициализации еще не запущен - запускаем его
    if (!dbInitPromise) {
      dbInitPromise = initDb({
        dbPath,
        migrationsFolder,
        schema,
        seedFn: seedDatabase
      }).then((dbRes) => {
        db = dbRes as AppDatabase
        return db
      })
    }

    await dbInitPromise
  } catch (e) {
    console.error('Failed to initialize DB', e)
    dbInitPromise = null // Сбрасываем промис при ошибке, чтобы попытаться снова при следующем вызове
    throw e
  }

  // 4. Теперь db точно не null
  return db!
}
