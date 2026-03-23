import { create } from 'zustand'

export type UpdateStatus =
  | 'idle'
  | 'checking'
  | 'available'
  | 'up-to-date'
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

  checkForUpdates: () => void
  downloadUpdate: () => void
  installUpdate: () => void
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

  initUpdateListener: () => {
    if (window.api?.onUpdateEvent) {
      window.api.onUpdateEvent((data) => {
        switch (data.type) {
          case 'available':
            set({ status: 'available' })
            break
          case 'not-available':
            set({ status: 'up-to-date' })
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
