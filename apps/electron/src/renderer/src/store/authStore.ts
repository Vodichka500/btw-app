import { create } from 'zustand'
import type { User } from '@btw-app/shared'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isAuthLoading: boolean

  setAuth: (user: User | null) => void
  setLoading: (loading: boolean) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isAuthLoading: true,

  setAuth: (user) =>
    set({
      user,
      isAuthenticated: !!user,
      isAuthLoading: false
    }),

  setLoading: (loading) => set({ isAuthLoading: loading }),

  logout: () =>
    set({
      user: null,
      isAuthenticated: false
    })
}))
