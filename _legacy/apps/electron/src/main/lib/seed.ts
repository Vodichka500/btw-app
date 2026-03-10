import { AppDatabase } from './db'
import { categories, snippets } from '@btw-app/shared'

export async function seedDatabase(db: AppDatabase): Promise<void> {
  console.log('🌱 Seeding database with initial data...')

  try {
    // 1. Корневая категория
    const rootCats = await db
      .insert(categories)
      .values({
        name: '👋 Добро пожаловать'
      })
      .returning()
    const rootCat = rootCats[0]

    // 2. Приветственный сниппет
    await db.insert(snippets).values({
      title: 'Быстрый старт',
      body: 'Добро пожаловать в BTW App! 🎉\n\nЭто простой текстовый сниппет.\nНажми, чтобы скопировать.\n\nПопробуй создать свои шаблоны!',
      categoryId: rootCat.id,
      favorite: true,
      variables: '[]',
      color: '#FFFFFF',
      order: 0
    })

    // 3. Вложенная категория
    const childCats = await db
      .insert(categories)
      .values({
        name: '📧 Шаблоны писем',
        parentId: rootCat.id
      })
      .returning()
    const childCat = childCats[0]

    // 4. Сниппет с переменными
    await db.insert(snippets).values({
      title: 'Приветствие клиента',
      body: 'Привет, {{name}}!\n\nРады видеть тебя в {{company}}.\n\nС уважением,\n{{manager}}',
      categoryId: childCat.id,
      favorite: false,
      color: '#8d9bea',
      order: 1,
      variables: JSON.stringify([
        { key: 'name', hint: 'Имя клиента' },
        { key: 'company', hint: 'Компания' },
        { key: 'manager', hint: 'Ваше имя' }
      ])
    })

    console.log('✅ Database seeded successfully.')
  } catch (error) {
    console.error('❌ Error seeding database:', error)
  }
}
