import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { trpc } from '@/lib/trpc'
import { isVersionOlder } from '@/lib/semver'
import { useUpdateStore } from '@/store/updateStore'
import { HardUpdateScreen } from './hard-update-screen'

export function AppInitializer({ children }: { children: React.ReactNode }) {
  const setIsMandatory = useUpdateStore((s) => s.setIsMandatory)
  const [localVersion, setLocalVersion] = useState<string | null>(null)

  // 1. Получаем инфу с сервера
  const {
    data: meta,
    isLoading: isServerLoading,
    isError
  } = trpc.meta.getAppInfo.useQuery(undefined, {
    refetchOnWindowFocus: false,
    retry: 2
  })

  // 2. Получаем локальную версию из Электрона
  useEffect(() => {
    window.api.getAppVersion().then(setLocalVersion)
    useUpdateStore.getState().initUpdateListener()
  }, [])

  // Если данные еще грузятся — показываем красивый Splash Screen
  if (isServerLoading || !localVersion) {
    return (
      <div className="flex flex-col items-center justify-center w-screen h-screen bg-background">
        {/* Можешь вставить сюда свой логотип */}
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-sm text-muted-foreground font-medium animate-pulse">
          Łączenie z serwerem...
        </p>
      </div>
    )
  }

  // Если сервер упал или нет интернета — пускаем (или показываем экран "Нет связи")
  // Пока просто пускаем, чтобы оффлайн-часть работала
  if (isError || !meta) {
    return <>{children}</>
  }

  // 3. СВЕРКА ВЕРСИЙ (КРИТИЧЕСКИЙ МОМЕНТ)
  const needsHardUpdate = isVersionOlder(localVersion, meta.minClientVersion)

  if (needsHardUpdate) {
    setIsMandatory(true) // Сообщаем стору, что обновление принудительное
    return <HardUpdateScreen />
  }

  const needsSoftUpdate = isVersionOlder(localVersion, meta.serverVersion)
  if (needsSoftUpdate && useUpdateStore.getState().status === 'idle') {
    useUpdateStore.getState().checkForUpdates()
  }

  // Если всё ок — рендерим само приложение (Sidebar, роуты и т.д.)
  return <>{children}</>
}
