import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AuthState {
  token: string | null
  serverUrl: string
  user: { id: number; email: string } | null
  setAuth: (token: string, user: { id: number; email: string }) => void
  setServerUrl: (url: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      serverUrl: 'http://localhost:3000',

      setAuth: (token, user) => set({ token, user }),
      setServerUrl: (url) => set({ serverUrl: url }),
      logout: () => set({ token: null, user: null })
    }),
    {
      name: 'clippy-auth-storage'
    }
  )
)
