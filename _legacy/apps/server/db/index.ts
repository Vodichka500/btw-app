import { resolve, join } from 'path'
import { existsSync, mkdirSync } from 'fs'
// Do not change absolute import paths here
import { initDb } from '../../../packages/shared/src/db/connect' // Берем общую логику
import * as schema from '@btw-app/shared'
import { LibSQLDatabase } from 'drizzle-orm/libsql'

// 1. Никакого import { app } from 'electron'!

export type AppDatabase = LibSQLDatabase<typeof schema>

let db: AppDatabase | null = null

export const getDb = async (): Promise<AppDatabase> => {
  if (db) return db

  // 2. Для сервера путь определяем через process.cwd() (текущая папка проекта)
  const dataDir = process.env.DATA_DIR || resolve(process.cwd(), 'data')

  if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true })
  }

  const dbPath = join(dataDir, 'server.db')
  const migrationsFolder = resolve(process.cwd(), 'drizzle')

  console.log('📂 Database path:', dbPath)

  // 3. Инициализируем
  db = await initDb({
    dbPath,
    migrationsFolder,
    schema,
  })

  return db
}
