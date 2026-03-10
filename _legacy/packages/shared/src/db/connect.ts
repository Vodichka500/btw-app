import { join } from 'path'
import { existsSync, mkdirSync, copyFileSync, readdirSync, unlinkSync } from 'fs'
import { drizzle, LibSQLDatabase } from 'drizzle-orm/libsql'
import { migrate } from 'drizzle-orm/libsql/migrator'
import { createClient } from '@libsql/client'

// Интерфейс для аргументов
interface InitDbOptions<TSchema extends Record<string, unknown>> {
  dbPath: string
  migrationsFolder: string
  schema: TSchema
  // DatabaseClass больше не нужен, LibSQL имеет свой клиент
  seedFn?: (db: LibSQLDatabase<TSchema>) => Promise<void>
}

// 👇 Функция стала async, т.к. миграции в LibSQL асинхронные
export const initDb = async <TSchema extends Record<string, unknown>>({
                                                                        dbPath,
                                                                        migrationsFolder,
                                                                        schema,
                                                                        seedFn
                                                                      }: InitDbOptions<TSchema>): Promise<LibSQLDatabase<TSchema>> => {

  // 1. Проверяем, первый ли это запуск (до создания файла)
  const isFirstRun = !existsSync(dbPath)
  const dbDir = join(dbPath, '..')

  // Убедимся, что папка существует
  if (!existsSync(dbDir)) {
    mkdirSync(dbDir, { recursive: true })
  }

  // 2. Бэкап (Работает через fs, поэтому используем обычный путь)
  if (!isFirstRun) {
    try {
      const backupsDir = join(dbDir, 'backups')
      if (!existsSync(backupsDir)) mkdirSync(backupsDir)

      const now = new Date()
      const format = (n: number) => String(n).padStart(2, '0')
      const timestamp = `${now.getFullYear()}-${format(now.getMonth() + 1)}-${format(now.getDate())}-${format(now.getHours())}-${format(now.getMinutes())}`
      const backupPath = join(backupsDir, `backup-${timestamp}.db`)

      copyFileSync(dbPath, backupPath)
      console.log(`✅ Database backup created: ${backupPath}`)

      // Удаляем старые бэкапы (оставляем последние 5)
      const files = readdirSync(backupsDir).sort().reverse()
      if (files.length > 5) {
        files.slice(5).forEach(file => unlinkSync(join(backupsDir, file)))
      }

    } catch (err) {
      console.error('⚠️ Failed to create database backup:', err)
    }
  }

  // 3. Подключение LibSQL
  // Важно: LibSQL требует префикс "file:" для локальных путей
  const url = `file:${dbPath}`
  console.log(`🔌 Connecting to LibSQL at ${url}`)

  const client = createClient({ url })
  const db = drizzle(client, { schema })

  // 4. Миграции (Теперь с await)
  try {
    if (existsSync(migrationsFolder)) {
      await migrate(db, { migrationsFolder })
      console.log('✅ Migrations applied.')
    } else {
      console.warn(`⚠️ Migrations folder not found at: ${migrationsFolder}`)
    }
  } catch (error) {
    // @ts-ignore
    if (error?.message?.includes('duplicate column name')) {
      console.warn('⚠️ Пропуск миграции: колонка уже существует. БД в актуальном состоянии.')
    } else {
      // Если ошибка другая — пробрасываем дальше
      console.error('❌ Ошибка миграции:', error)
      throw error
    }
  }

  // 5. Сидинг
  if (isFirstRun && seedFn) {
    console.log('🌱 Seeding database...')
    await seedFn(db).catch((err) => console.error('❌ Seeding failed:', err))
  }

  return db
}