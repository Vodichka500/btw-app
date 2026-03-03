import { app } from 'electron'
import { join } from 'path'
// Do not change absolute import paths here
import { initDb } from '../../../../../packages/shared/src/db/connect'
import * as schema from '@btw-app/shared'
import { seedDatabase } from './seed'
import { LibSQLDatabase } from 'drizzle-orm/libsql'

// Тип базы теперь LibSQLDatabase
export type AppDatabase = LibSQLDatabase<typeof schema>
let db: AppDatabase | null = null

// 👇 Теперь getDb асинхронная, так как initDb асинхронная
export const getDb = async (): Promise<AppDatabase> => {
  if (db) return db

  const userDataPath = app.getPath('userData')
  const dbPath = join(userDataPath, 'clippy.db') // Имя файла

  const migrationsFolder = app.isPackaged
    ? join(process.resourcesPath, 'drizzle')
    : join(app.getAppPath(), 'drizzle')

  try {
    db = await initDb({
      dbPath,
      migrationsFolder,
      schema,
      // DatabaseClass больше не передаем
      seedFn: seedDatabase
    })
  } catch (e) {
    console.error('Failed to initialize DB', e)
    throw e
  }

  return db!
}
