import { ElectronAPI } from '@electron-toolkit/preload'
import { ChangeOrderCategoryInput } from '../../../../packages/shared/src/shemas/category'
import { ipcRenderer } from 'electron'
import {
  ApiResponse,
  isAuthResponse,
  Teacher,
  TeacherScheduleMap, TeacherUpdateInput,
  UpdateTeachersResponse
} from '@btw-app/shared'
import { CreateSubject, UpdateSubject } from '../../../../packages/shared/src/shemas/schedule'

interface CustomApi {
  // Ping
  ping: () => Promise<void>

  // Categories
  getCategories: () => Promise<Category[]>
  createCategory: (data: CreateCategoryInput) => Promise<Category>
  updateCategory: (data: UpdateCategoryInput) => Promise<Category>
  deleteCategory: (id: number) => Promise<Category> // Soft delete
  updateCategoryStructure: (updates: ChangeOrderCategoryInput[]) => Promise<boolean>

  // Snippets
  getSnippets: (filter: SnippetFilter) => Promise<Snippet[]>
  createSnippet: (data: CreateSnippetInput) => Promise<Snippet>
  updateSnippet: (data: UpdateSnippetInput) => Promise<Snippet>
  deleteSnippet: (id: number) => Promise<Snippet> // Soft delete
  reorderSnippets: (items: { id: number; order: number }[]) => Promise<boolean>

  // Trash
  getTrash: () => Promise<{ categories: Category[]; snippets: Snippet[] }>
  restoreItem: (type: recycleBinItemType, id: number) => Promise<Snippet | Category>
  hardDeleteItem: (type: recycleBinItemType, id: number) => Promise<void>
  emptyTrash: () => Promise<{ deleted: number }>

  // Alfa CRM
  alfaCrmLogin: () => Promise<ApiResponse<null>>
  alfaCrmUpdateTeachers: () => Promise<ApiResponse<UpdateTeachersResponse>>
  alfaCrmGetTeachers: () => Promise<ApiResponse<Teacher[]>>
  alfaCrmCheckAuth: () => Promise<ApiResponse<isAuthResponse>>
  alfaCrmLogout: () => Promise<ApiResponse<null>>
  alfaCrmGetTeacherScheduleById: (
    teacherAlfacrmId: number
  ) => Promise<ApiResponse<TeacherScheduleMap>>
  alfaCrmModifyWorkingHour: (data: ModifyWorkingHourInput) => Promise<ApiResponse<null>>

  // Schedule
  scheduleGetData: () => Promise<ApiResponse<ScheduleDataResponse>>
  scheduleGetTeachers: () => Promise<ApiResponse<Teacher[]>>
  scheduleCreateSubject: (data: CreateSubject) => Promise<ApiResponse<Subject>>
  scheduleUpdateSubject: (data: UpdateSubject) => Promise<ApiResponse<null>>
  scheduleDeleteSubject: (id: number) => Promise<ApiResponse<null>>
  scheduleUpdateTeacherSubjects: (
    teacherId: number,
    subjectIds: number[]
  ) => Promise<ApiResponse<null>>
  scheduleGetTeacherSubjects: (teacherId: number) => Promise<ApiResponse<number[]>>
  scheduleTeacherUpdate: (data: TeacherUpdateInput) => Promise<ApiResponse<null>>

  // Auto Updater
  onUpdateAvailable: (callback: (version: string) => void) => void
  onUpdateProgress: (callback: (percent: number) => void) => void
  onUpdateDownloaded: (callback: (version: string) => void) => void
  installUpdate: () => Promise<void>
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: CustomApi
  }
}
