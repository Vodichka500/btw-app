import { createSelectSchema } from 'drizzle-zod'
import {
  alfaSettings,
  categories,
  snippets,
  subjects,
  teachers,
  teacherSubjects,
  teacherWorkingHours
} from '../db/schema'
// import { z } from 'zod' - больше не нужен для вывода типов базы

// --- CATEGORY ---
export const CategorySchema = createSelectSchema(categories)
export type Category = typeof categories.$inferSelect

// --- SNIPPET ---
export const SnippetSchema = createSelectSchema(snippets)
export type Snippet = typeof snippets.$inferSelect

// --- ALFA SETTINGS ---
export const AlfaSettingsSchema = createSelectSchema(alfaSettings)
export type AlfaSettings = typeof alfaSettings.$inferSelect

// --- TEACHERS ---
export const TeacherSchema = createSelectSchema(teachers)
export type Teacher = typeof teachers.$inferSelect

// 🔥 Добавляем типы для создания и апдейта, чтобы починить тот самый schedule.ts
export type TeacherCreateInput = typeof teachers.$inferInsert
export type TeacherUpdateInput = Partial<typeof teachers.$inferInsert> & { id: number }

// --- SUBJECTS ---
export const SubjectSchema = createSelectSchema(subjects)
export type Subject = typeof subjects.$inferSelect

// --- TEACHER SUBJECTS ---
export const TeacherSubjectsSchema = createSelectSchema(teacherSubjects)
export type TeacherSubject = typeof teacherSubjects.$inferSelect

// --- TEACHER WORKING HOURS ---
export const TeacherWorkingHoursSchema = createSelectSchema(teacherWorkingHours)
export type TeacherWorkingHours = typeof teacherWorkingHours.$inferSelect