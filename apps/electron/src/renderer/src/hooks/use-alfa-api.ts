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
      // Вычитаем 1 минуту для страховки
      expiresAt: Date.now() + expiresIn * 1000 - 60000
    }),
  clearToken: () => set({ token: null, expiresAt: null })
}))

export const useAlfaApi = () => {
  const { token, expiresAt, setToken, clearToken } = useAlfaTokenStore()
  const trpcUtils = trpc.useUtils()

  const getValidToken = async (): Promise<string | null> => {
    // 1. Если токен есть в оперативке и он живой — отдаем сразу
    if (token && expiresAt && Date.now() < expiresAt) {
      return token
    }

    // 2. Иначе просим наш сервер сгенерировать новый
    try {
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
