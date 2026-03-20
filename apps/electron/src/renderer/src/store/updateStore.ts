import { create } from 'zustand'

export type UpdateStatus =
  | 'idle'
  | 'checking'
  | 'available'
  | 'not-available'
  | 'downloading'
  | 'ready'
  | 'error'

interface UpdateState {
  status: UpdateStatus
  progress: number
  isMandatory: boolean
  errorMsg: string | null

  setStatus: (status: UpdateStatus) => void
  setProgress: (progress: number) => void
  setIsMandatory: (isMandatory: boolean) => void

  // Команды
  checkForUpdates: () => void
  downloadUpdate: () => void
  installUpdate: () => void

  // Инициализация слушателя
  initUpdateListener: () => void
}

export const useUpdateStore = create<UpdateState>((set) => ({
  status: 'idle',
  progress: 0,
  isMandatory: false,
  errorMsg: null,

  setStatus: (status) => set({ status }),
  setProgress: (progress) => set({ progress }),
  setIsMandatory: (isMandatory) => set({ isMandatory }),

  checkForUpdates: () => {
    set({ status: 'checking', errorMsg: null })
    if (window.api?.checkForUpdates) window.api.checkForUpdates()
  },

  downloadUpdate: () => {
    set({ status: 'downloading', progress: 0 })
    if (window.api?.downloadUpdate) window.api.downloadUpdate()
  },

  installUpdate: () => {
    if (window.api?.installUpdate) window.api.installUpdate()
  },

  // Эта функция будет вызвана один раз при старте приложения
  initUpdateListener: () => {
    if (window.api?.onUpdateEvent) {
      window.api.onUpdateEvent((data) => {
        switch (data.type) {
          case 'available':
            set({ status: 'available' })
            break
          case 'not-available':
            set({ status: 'idle' }) // Возвращаем в idle, если обновлений нет
            break
          case 'progress':
            set({ progress: data.percent })
            break
          case 'downloaded':
            set({ status: 'ready', progress: 100 })
            break
          case 'error':
            set({ status: 'error', errorMsg: data.message })
            break
        }
      })
    }
  }
}))
