'use client'

import { useState, useMemo } from 'react'
import { Save, Loader2, Clock, Bell } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/shared/ui/card'
import { Input } from '@/components/shared/ui/input'
import { Label } from '@/components/shared/ui/label'
import { Button } from '@/components/shared/ui/button'
import { Badge } from '@/components/shared/ui/badge'
import { toast } from 'sonner'
import { ReportSettings, trpc } from '@/lib/trpc'
import { ReminderTemplateEditor } from './reminder-template-editor'


export function SettingsTab() {
  const { data: settings, isLoading } = trpc.reports.getSettings.useQuery()

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!settings) return null

  return <SettingsForm settings={settings} />
}

// ==========================================================
// 2. ФОРМА: Управляет стейтом
// ==========================================================
function SettingsForm({ settings }: { settings: ReportSettings }) {
  const trpcUtils = trpc.useUtils()

  const [deadlineDays, setDeadlineDays] = useState<string>(settings.deadlineDays.toString())
  const [reminderText, setReminderText] = useState<string>(settings.defaultReminderText || '')

  // --- ПРОВЕРКА НА ИЗМЕНЕНИЯ (isDirty) ---
  const isDirty = useMemo(() => {
    if (parseInt(deadlineDays) !== settings.deadlineDays) return true
    if (reminderText !== (settings.defaultReminderText || '')) return true
    return false
  }, [settings, deadlineDays, reminderText])

  // --- МУТАЦИИ ---
  const updateSettingsMut = trpc.reports.updateGeneralSettings.useMutation({
    onSuccess: () => {
      toast.success('Ustawienia generalne zostały zapisane!')
      trpcUtils.reports.getSettings.invalidate()
    },
    onError: (err) => toast.error(`Błąd: ${err.message}`)
  })

  // --- ОБРАБОТЧИКИ СОБЫТИЙ ---
  const handleSaveGeneralSettings = () => {
    updateSettingsMut.mutate({
      deadlineDays: parseInt(deadlineDays) || 7,
      defaultReminderText: reminderText
    })
  }


  // Предпросмотр с фейковыми данными
  const renderPreview = () => {
    let preview = reminderText
    if (!preview) return 'Brak tekstu.'

    // Заменяем все возможные теги на тестовые данные
    preview = preview.replace(/{TEACHER_NAME}/g, 'Jan')
    preview = preview.replace(/{CYCLE_NAME}/g, 'Grupy B2')
    preview = preview.replace(/{PERIOD_START}/g, '01.10.2023')
    preview = preview.replace(/{PERIOD_END}/g, '31.10.2023')
    preview = preview.replace(/{PENDING_COUNT}/g, '5')
    preview = preview.replace(/{TOTAL_COUNT}/g, '12')
    preview = preview.replace(/{DEADLINE}/g, '15.11.2023')

    return preview
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {isDirty && (
        <div className="flex items-center justify-between bg-amber-500/10 p-4 rounded-xl border border-amber-500/30 animate-in fade-in slide-in-from-top-2 sticky top-0 z-10 shadow-sm backdrop-blur-md">
          <div>
            <h3 className="font-semibold text-amber-700 dark:text-amber-500">Niezapisane zmiany</h3>
            <p className="text-sm text-amber-600/80 dark:text-amber-500/80">
              Masz zmiany, które wymagają zapisania.
            </p>
          </div>
          <Button
            onClick={handleSaveGeneralSettings}
            disabled={updateSettingsMut.isLoading}
            className="rounded-xl bg-amber-500 hover:bg-amber-600 text-white"
          >
            {updateSettingsMut.isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Zapisz ustawienia
          </Button>
        </div>
      )}

      {/* Card 1: Okienko i Restrykcje (Deadline) */}
      <Card className="rounded-xl border-border bg-card/50 shadow-sm max-w-2xl">
        <CardHeader>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Clock className="w-5 h-5 text-primary" />
            </div>
            <CardTitle className="text-lg">Czas na wypełnienie</CardTitle>
          </div>
          <CardDescription>
            Określ, ile dni mają nauczyciele na przesłanie raportów od momentu wygenerowania cyklu
            przez administratora.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Label htmlFor="deadlineDays" className="text-sm font-semibold">
              Liczba dni roboczych
            </Label>
            <div className="flex items-center gap-3">
              <Input
                id="deadlineDays"
                type="number"
                value={deadlineDays}
                onChange={(e) => setDeadlineDays(e.target.value)}
                min="1"
                max="30"
                className="rounded-xl max-w-[120px] text-center text-lg font-bold"
              />
              <span className="text-muted-foreground text-sm font-medium">dni</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              * Po upływie tego czasu raporty otrzymają status{' '}
              <Badge variant="destructive" className="scale-75 origin-left">
                Opóźnione
              </Badge>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Card 2: Szablon Przypomnienia */}
      <Card className="rounded-xl border-border bg-card/50 shadow-sm flex flex-col">
        <CardHeader>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Bell className="w-5 h-5 text-blue-500" />
            </div>
            <CardTitle className="text-lg">Domyślny szablon przypomnienia</CardTitle>
          </div>
          <CardDescription>
            Ten tekst będzie domyślnie używany podczas ręcznego wysyłania przypomnień do
            nauczycieli.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ReminderTemplateEditor
            value={reminderText}
            onChange={setReminderText}
            renderPreview={renderPreview}
          />
        </CardContent>
      </Card>
    </div>
  )
}
