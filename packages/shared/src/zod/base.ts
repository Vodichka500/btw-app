import { createSelectSchema } from 'drizzle-zod'
import { alfaSettings, categories, snippets, subjects, teachers, teacherSubjects, teacherWorkingHours } from '../db/schema'
import { z } from 'zod'

export const CategorySchema = createSelectSchema(categories)
export type Category = z.infer<typeof CategorySchema>

export const SnippetSchema = createSelectSchema(snippets)
export type Snippet = z.infer<typeof SnippetSchema>

export const AlfaSettingsSchema = createSelectSchema(alfaSettings)
export type AlfaSettings = z.infer<typeof AlfaSettingsSchema>

export const TeacherSchema = createSelectSchema(teachers)
export type Teacher = z.infer<typeof TeacherSchema>

export const SubjectSchema = createSelectSchema(subjects)
export type Subject = z.infer<typeof SubjectSchema>

export const TeacherSubjectsSchema = createSelectSchema(teacherSubjects)
export type TeacherSubject = z.infer<typeof TeacherSubjectsSchema>

export const TeacherWorkingHoursSchema = createSelectSchema(teacherWorkingHours)
export type TeacherWorkingHours = z.infer<typeof TeacherWorkingHoursSchema>