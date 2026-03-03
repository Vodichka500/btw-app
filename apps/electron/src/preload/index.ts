import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

import {
  Category,
  UpdateTeachersResponse,
  isAuthResponse,
  Snippet,
  Teacher,
  ApiResponse,
  TeacherScheduleMap,
  TeacherUpdateInput, ModifyWorkingHourInput
} from '@btw-app/shared'
import  { ChangeOrderCategoryInput, CreateCategoryInput, UpdateCategoryInput } from '@btw-app/shared'
import type { CreateSnippetInput, UpdateSnippetInput, SnippetFilter } from '@btw-app/shared'
import type { RecycleBinItemType } from '@btw-app/shared'
import { CreateSubject, UpdateSubject } from '../../../../packages/shared/src/shemas/schedule'

// Custom APIs for renderer
const api = {
  // --- PING ---
  ping: () => ipcRenderer.invoke('ping'),

  // --- CATEGORIES ---
  getCategories: (): Promise<Category[]> => ipcRenderer.invoke('db:get-categories'),

  createCategory: (data: CreateCategoryInput): Promise<Category> =>
    ipcRenderer.invoke('db:create-category', data),

  updateCategory: (data: UpdateCategoryInput): Promise<Category> =>
    ipcRenderer.invoke('db:update-category', data),

  deleteCategory: (id: number): Promise<Category> =>
    ipcRenderer.invoke('db:soft-delete-category', id),

  updateCategoryStructure: (updates: ChangeOrderCategoryInput[]): Promise<boolean> =>
    ipcRenderer.invoke('db:update-category-structure', updates),
  // --- SNIPPETS ---
  getSnippets: (filter: SnippetFilter): Promise<Snippet[]> =>
    ipcRenderer.invoke('db:get-snippets', filter),

  createSnippet: (data: CreateSnippetInput): Promise<Snippet> =>
    ipcRenderer.invoke('db:create-snippet', data),

  updateSnippet: (data: UpdateSnippetInput): Promise<Snippet> =>
    ipcRenderer.invoke('db:update-snippet', data),

  deleteSnippet: (id: number): Promise<Snippet> => ipcRenderer.invoke('db:soft-delete-snippet', id),

  reorderSnippets: (items: { id: number; order: number }[]): Promise<boolean> =>
    ipcRenderer.invoke('db:reorder-snippets', items),
  // --- TRASH / RECYCLE BIN ---
  getTrash: (): Promise<{ categories: Category[]; snippets: Snippet[] }> =>
    ipcRenderer.invoke('db:get-trash'),

  restoreItem: (type: RecycleBinItemType, id: number): Promise<Snippet | Category> =>
    ipcRenderer.invoke('db:restore-item', { type, id }),

  hardDeleteItem: (type: RecycleBinItemType, id: number): Promise<void> =>
    ipcRenderer.invoke('db:hard-delete-item', { type, id }),

  emptyTrash: (): Promise<{ deleted: number }> => ipcRenderer.invoke('db:empty-trash'),

  // Alfa CRM
  alfaCrmLogin: (): Promise<ApiResponse<null>> => ipcRenderer.invoke('alfa-crm:login'),
  alfaCrmUpdateTeachers: (): Promise<ApiResponse<UpdateTeachersResponse>> =>
    ipcRenderer.invoke('alfa-crm:get-teachers'),
  alfaCrmGetTeachers: (): Promise<ApiResponse<Teacher[]>> =>
    ipcRenderer.invoke('alfa-crm:get-teachers'),
  alfaCrmCheckAuth: (): Promise<ApiResponse<isAuthResponse>> =>
    ipcRenderer.invoke('alfa-crm:check-auth'),
  alfaCrmLogout: (): Promise<ApiResponse<null>> => ipcRenderer.invoke('alfa-crm:logout'),
  alfaCrmGetTeacherScheduleById: (
    teacherAlfacrmId: number
  ): Promise<ApiResponse<TeacherScheduleMap>> =>
    ipcRenderer.invoke('alfa-crm:get-teacher-schedule-by-id', teacherAlfacrmId),
  alfaCrmModifyWorkingHour: (data: ModifyWorkingHourInput): Promise<ApiResponse<null>> =>
    ipcRenderer.invoke('alfa-crm:modify-working-hour', data),

  // --- SCHEDULE ---
  scheduleGetData: () => ipcRenderer.invoke('schedule:get-data'),
  scheduleGetTeachers: () => ipcRenderer.invoke('schedule:get-teachers'),
  scheduleCreateSubject: (data: CreateSubject) =>
    ipcRenderer.invoke('schedule:create-subject', data),
  scheduleUpdateSubject: (data: UpdateSubject) =>
    ipcRenderer.invoke('schedule:update-subject', data),
  scheduleDeleteSubject: (id) => ipcRenderer.invoke('schedule:delete-subject', id),
  scheduleUpdateTeacherSubjects: (teacherId, subjectIds) =>
    ipcRenderer.invoke('schedule:update-teacher-subjects', { teacherId, subjectIds }),
  scheduleGetTeacherSubjects: (teacherId) =>
    ipcRenderer.invoke('schedule:get-teacher-subjects', teacherId),
  scheduleTeacherUpdate: (data: TeacherUpdateInput) =>
    ipcRenderer.invoke('schedule:update-teacher', data),

  // Updater
  onUpdateAvailable: (callback) =>
    ipcRenderer.on('updater:available', (_, version) => callback(version)),

  onUpdateProgress: (callback) =>
    ipcRenderer.on('updater:progress', (_, percent) => callback(percent)),

  onUpdateDownloaded: (callback) =>
    ipcRenderer.on('updater:downloaded', (_, version) => callback(version)),

  installUpdate: () => ipcRenderer.invoke('updater:install'),
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
