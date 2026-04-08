'use client'

import { useEffect, useState } from 'react'
import { useUpdateStore } from '@/store/updateStore'
import { Button } from '@/components/shared/ui/button'
import { trpc } from '@/lib/trpc'
import { toast } from 'sonner'
import {
  Download,
  CheckCircle,
  Loader2,
  MonitorUp,
  AlertTriangle,
  Send,
  LogOut,
  Settings2,
  Phone
} from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/shared/ui/alert-dialog'
import { TelegramAuthModal } from '@/components/features/telegram/telegram-auth-modal'

export function SettingsPage() {
  const { status, progress, errorMsg, checkForUpdates, downloadUpdate, installUpdate } =
    useUpdateStore()
  const [currentVersion, setCurrentVersion] = useState('Ładowanie...')

  const utils = trpc.useUtils()

  // 🔥 Подключаем реальный статус из БД
  const { data: tgStatus, isLoading: isStatusLoading } = trpc.telegram.status.useQuery()

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [isLogoutAlertOpen, setIsLogoutAlertOpen] = useState(false)

  // 🔥 Подключаем реальный логаут
  const logoutMut = trpc.telegram.logout.useMutation({
    onSuccess: () => {
      utils.telegram.status.invalidate()
      setIsLogoutAlertOpen(false)
      toast.success('Wylogowano z Telegrama pomyślnie.')
    },
    onError: (err) => {
      toast.error(err.message || 'Błąd podczas wylogowywania')
      setIsLogoutAlertOpen(false)
    }
  })

  useEffect(() => {
    if (typeof window !== 'undefined' && window.api?.getAppVersion) {
      window.api.getAppVersion().then(setCurrentVersion)
    } else {
      setCurrentVersion('1.0.0 (Web)')
    }
  }, [])

  const handleTgLogout = () => {
    logoutMut.mutate()
  }

  const isTgConnected = tgStatus?.isConnected || false

  return (
    <div className="flex-1 overflow-y-auto bg-background p-8 custom-scrollbar">
      <div className="max-w-3xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Ustawienia aplikacji</h1>
          <p className="text-muted-foreground mt-2">
            Zarządzaj połączeniem z Telegramem i aktualizacjami systemu.
          </p>
        </div>

        <div className="space-y-8">
          {/* SEKCJA TELEGRAM */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Send className="w-5 h-5 text-[#2AABEE]" />
              <h2 className="text-xl font-semibold">Integracja Telegram</h2>
            </div>

            <div className="p-6 border rounded-2xl bg-card shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 transition-all">
              <div>
                <h3 className="text-base font-semibold">Konto wysyłkowe</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-md">
                  Podłącz konto, z którego będą wysyłane automatyczne powiadomienia do klientów.
                </p>

                <div className="mt-4 flex items-center gap-3">
                  {/* Статус */}
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-3 w-3">
                      {isTgConnected ? (
                        <>
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                        </>
                      ) : (
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-destructive"></span>
                      )}
                    </span>
                    <span className="text-sm font-medium">
                      {isTgConnected ? 'Połączono' : 'Brak połączenia'}
                    </span>
                  </div>

                  {/* 🔥 Отображение номера телефона */}
                  {isTgConnected && tgStatus?.phoneNumber && (
                    <>
                      <div className="w-px h-4 bg-border"></div> {/* Разделитель */}
                      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-secondary border rounded-lg shadow-sm">
                        <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-sm font-mono font-medium tracking-wide">
                          {tgStatus.phoneNumber}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="shrink-0">
                {isStatusLoading ? (
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                ) : isTgConnected ? (
                  <Button
                    variant="outline"
                    className="rounded-xl text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/20"
                    onClick={() => setIsLogoutAlertOpen(true)}
                    disabled={logoutMut.isPending}
                  >
                    {logoutMut.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <LogOut className="w-4 h-4 mr-2" />}
                    Wyloguj
                  </Button>
                ) : (
                  <Button
                    className="rounded-xl bg-[#2AABEE] hover:bg-[#2298D6] text-white shadow-sm"
                    onClick={() => setIsAuthModalOpen(true)}
                  >
                    <Send className="w-4 h-4 mr-2" /> Podłącz konto
                  </Button>
                )}
              </div>
            </div>
          </section>

          {/* SEKCJA AKTUALIZACJI */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <MonitorUp className="w-5 h-5 text-muted-foreground" />
              <h2 className="text-xl font-semibold">Aktualizacje</h2>
            </div>

            <div className="p-6 border rounded-2xl bg-card shadow-sm space-y-6">
              <div>
                <h3 className="text-base font-semibold">Obecna wersja</h3>
                <p className="text-2xl font-mono mt-1 text-primary">{currentVersion}</p>
              </div>

              <div className="pt-4 border-t border-border/50">
                {(status === 'idle' || status === 'up-to-date') && (
                  <div className="space-y-4">
                    {status === 'up-to-date' && (
                      <p className="text-sm text-emerald-600 font-medium flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" /> Masz najnowszą wersję aplikacji.
                      </p>
                    )}
                    <Button variant="outline" onClick={checkForUpdates} className="rounded-xl">
                      Sprawdź aktualizacje
                    </Button>
                  </div>
                )}

                {status === 'checking' && (
                  <Button variant="outline" disabled className="rounded-xl">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Szukanie aktualizacji...
                  </Button>
                )}

                {status === 'available' && (
                  <div className="space-y-4">
                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl dark:bg-emerald-500/10 dark:border-emerald-500/20">
                      <span className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                        🎉 Dostępna jest nowa wersja!
                      </span>
                    </div>
                    <Button
                      onClick={downloadUpdate}
                      className="rounded-xl bg-primary text-primary-foreground"
                    >
                      <Download className="mr-2 h-4 w-4" /> Pobierz aktualizację
                    </Button>
                  </div>
                )}

                {status === 'downloading' && (
                  <div className="space-y-3 w-full max-w-sm">
                    <div className="flex justify-between text-sm font-medium text-muted-foreground">
                      <span>Pobieranie plików...</span>
                      <span>{Math.round(progress)}%</span>
                    </div>
                    <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-300 ease-out"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {status === 'ready' && (
                  <div className="space-y-4">
                    <p className="text-sm text-emerald-600 font-medium">
                      Aktualizacja gotowa do instalacji!
                    </p>
                    <Button
                      onClick={installUpdate}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl"
                    >
                      <CheckCircle className="mr-2 h-4 w-4" /> Uruchom ponownie i zaktualizuj
                    </Button>
                  </div>
                )}

                {status === 'error' && (
                  <div className="space-y-4">
                    <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-semibold text-destructive">
                          Błąd aktualizacji
                        </h4>
                        <p className="text-sm text-destructive/80 mt-1">
                          {errorMsg || 'Nieznany błąd'}
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" onClick={checkForUpdates} className="rounded-xl">
                      Spróbuj ponownie
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* ZAGŁUSZKA OGÓLNE */}
          <section className="space-y-4 opacity-50">
            <div className="flex items-center gap-2">
              <Settings2 className="w-5 h-5 text-muted-foreground" />
              <h2 className="text-xl font-semibold">Ogólne ustawienia</h2>
            </div>
            <div className="p-6 border rounded-2xl bg-card text-center text-muted-foreground text-sm">
              Tutaj w przyszłości pojawią się dodatkowe opcje.
            </div>
          </section>
        </div>
      </div>

      {/* MODAL LOGOWANIA TELEGRAM */}
      <TelegramAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={() => utils.telegram.status.invalidate()}
      />

      {/* ALERT WYLOGOWANIA TELEGRAM */}
      <AlertDialog open={isLogoutAlertOpen} onOpenChange={setIsLogoutAlertOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Odłączyć konto Telegram?</AlertDialogTitle>
            <AlertDialogDescription>
              Wysyłanie automatycznych powiadomień zostanie natychmiast wstrzymane. Aby wznowić
              wysyłkę, konieczne będzie ponowne zalogowanie (podanie numeru i kodu SMS).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl" disabled={logoutMut.isPending}>
              Anuluj
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault() // Чтобы предотвратить автоматическое закрытие до мутации
                handleTgLogout()
              }}
              disabled={logoutMut.isPending}
              className="rounded-xl bg-destructive hover:bg-destructive/90 text-white"
            >
              {logoutMut.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Tak, wyloguj
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
