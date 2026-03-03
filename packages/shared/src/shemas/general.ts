// Тип элемента в корзине
export type RecycleBinItemType = 'category' | 'snippet'

// Унифицированный интерфейс для отображения списка в корзине
export interface RecycleBinItem {
  id: number
  type: RecycleBinItemType
  name: string // У категорий это name, у сниппетов title -> мапим в name
  deletedAt: Date
}

// Режимы просмотра в сайдбаре
export type ViewMode = 'all' | 'favorites' | 'category' | 'trash' | 'notes' | 'teacher'

export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string }