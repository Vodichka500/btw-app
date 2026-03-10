import { getDb } from './index'
import { users } from '@btw-app/shared'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'

export async function main() {
  console.log('🌱 Starting server seed...')

  const db = await getDb()

  const EMAIL = 'admin@clippy.com'
  const PASSWORD = 'password123'

  // 1. Проверяем, существует ли пользователь
  const existingUser = await db.select().from(users).where(eq(users.email, EMAIL)).get()

  if (existingUser) {
    console.log(`⚠️ User ${EMAIL} already exists. Skipping.`)
    return
  }

  // 2. Хешируем пароль
  console.log('🔐 Hashing password...')
  const hashedPassword = await bcrypt.hash(PASSWORD, 10)

  // 3. Создаем пользователя
  const newUser = await db.insert(users).values({
    email: EMAIL,
    passwordHash: hashedPassword,
    // createdAt заполнится автоматически благодаря defaultNow() в схеме
  }).returning().get()

  console.log('✅ Admin user created!')
  console.log(`📧 Email: ${newUser.email}`)
  console.log(`🔑 Password: ${PASSWORD}`)
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(() => {
    process.exit(0)
  })