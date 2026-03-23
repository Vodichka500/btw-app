import { create } from 'zustand'
import { trpc } from '@/lib/trpc'

interface AlfaTokenState {
  token: string | null
  expiresAt: number | null
  setToken: (token: string, expiresIn: number) => void
  clearToken: () => void
}

const useAlfaTokenStore = create<AlfaTokenState>((set) => ({
  token: null,
  expiresAt: null,
  setToken: (token, expiresIn) =>
    set({
      token,
      expiresAt: Date.now() + expiresIn * 1000 - 60000
    }),
  clearToken: () => set({ token: null, expiresAt: null })
}))

export const useAlfaApi = () => {
  const { token, expiresAt, setToken, clearToken } = useAlfaTokenStore()
  const trpcUtils = trpc.useUtils()

  const getValidToken = async (forceRefresh: boolean = false): Promise<string | null> => {
    // 1. Если не форсируем и токен живой — отдаем из кэша
    if (!forceRefresh && token && expiresAt && Date.now() < expiresAt) {
      return token
    }

    try {
      await trpcUtils.alfa.getTempToken.invalidate()

      const data = await trpcUtils.alfa.getTempToken.fetch()
      setToken(data.token, data.expiresIn)
      return data.token
    } catch (error) {
      console.error('Błąd pobierania tokena AlfaCRM z serwera', error)
      clearToken()
      return null
    }
  }

  return { getValidToken, clearToken }
}
