// src/shared/db/schema.ts
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'
import { relations } from 'drizzle-orm'

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
})

export const categories = sqliteTable('categories', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  order: integer('order').default(0).notNull(),
  parentId: integer('parent_id'), // Ссылка на родителя
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  deletedAt: integer('deleted_at', { mode: 'timestamp' }), // Soft delete
})

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  parent: one(categories, {
    fields: [categories.parentId],
    references: [categories.id],
    relationName: 'sub_categories',
  }),
  children: many(categories, {
    relationName: 'sub_categories',
  }),
  snippets: many(snippets),
}))

export const snippets = sqliteTable('snippets', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  body: text('body').notNull(),
  variables: text('variables').default('[]'), // JSON строка
  categoryId: integer('category_id')
    .references(() => categories.id, { onDelete: 'cascade' })
    .notNull(),
  favorite: integer('favorite', { mode: 'boolean' }).default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()), // В Drizzle update time ручной, но оставим так
  deletedAt: integer('deleted_at', { mode: 'timestamp' }),
  color: text('color').default('#FFFFFF'),
  order: integer('order').default(0).notNull()
})

export const snippetsRelations = relations(snippets, ({ one }) => ({
  category: one(categories, {
    fields: [snippets.categoryId],
    references: [categories.id],
  }),
}))

export const alfaSettings = sqliteTable('alfa_settings', {
  id: integer('id').primaryKey(),
  email: text('email').notNull(),
  apiKey: text('api_key').notNull(),
  token: text('token'),
  tokenExpiresAt: integer('token_expires_at', { mode: 'timestamp' }),
})

export const subjects = sqliteTable('subjects', {
  id: integer('id').primaryKey(),
  alfacrmId: integer('alfacrm_id'), // ID прямо из AlfaCRM
  name: text('name').notNull(),
  order: integer('order').default(0).notNull(),

})

export const teachers = sqliteTable('teachers', {
  id: integer('id').primaryKey(),
  alfacrmId: integer('alfacrm_id').notNull(), // ID прямо из AlfaCRM
  name: text('name').notNull(),
  email: text('email'),
  phone: text('phone'),
  avatarUrl: text('avatar_url'),
  note: text('note').default("Заметка"),
})

// 4. Связь Преподаватель <-> Предмет (Многие-ко-многим)
// Это позволит положить одного препода в папку "Математика" и "Химия"
export const teacherSubjects = sqliteTable('teacher_subjects', {
  teacherId: integer('teacher_id').references(() => teachers.id).notNull(),
  subjectId: integer('subject_id').references(() => subjects.id).notNull(),
})


export const teacherWorkingHours = sqliteTable('teacher_working_hours', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  teacherId: integer('teacher_id')
    .references(() => teachers.id, { onDelete: 'cascade' })
    .notNull(),
  dayIndex: integer('day_index').notNull(), // Наш родной формат: 0(Пн) - 6(Вс)
  timeFrom: text('time_from').notNull(), // Формат "HH:MM"
  timeTo: text('time_to').notNull(), // Формат "HH:MM"
})

// 🔥 2. Обновляем связи для Drizzle ORM
export const teachersRelations = relations(teachers, ({ many }) => ({
  subjects: many(teacherSubjects),
  workingHours: many(teacherWorkingHours), // Связь один-ко-многим
}))

export const teacherWorkingHoursRelations = relations(teacherWorkingHours, ({ one }) => ({
  teacher: one(teachers, {
    fields: [teacherWorkingHours.teacherId],
    references: [teachers.id],
  }),
}))