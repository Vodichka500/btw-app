import { useState } from 'react'
import { Wand2 } from 'lucide-react'
import { Button } from '@/components/shared/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/shared/ui/tabs'
import { ReportsDashboardTab } from '@/components/features/reports/admin/dashboard-tab/reports-dashboard-tab'
import { SettingsTab } from '@/components/features/reports/admin/settings-tab'
import { TemplatesTab } from '@/components/features/reports/admin/templates-tab'
import { GenerateCycleModal } from '@/components/features/reports/admin/generate-cycle-modal'

export function ReportsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-gradient-to-br from-background to-secondary/20">
      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
        <div className="mx-auto max-w-7xl space-y-6 h-full flex flex-col">
          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between shrink-0">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">Raporty i Oceny</h1>
              <p className="text-muted-foreground mt-1 font-medium">
                Zarządzanie raportami okresowymi, szablonami i statystykami.
              </p>
            </div>

            <Button
              className="w-fit rounded-xl shadow-sm hover:shadow-primary/20 transition-shadow"
              onClick={() => setIsModalOpen(true)}
            >
              <Wand2 className="mr-2 h-4 w-4" />
              Wygeneruj nowy cykl
            </Button>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="dashboard" className="flex-1 flex flex-col min-h-0">
            <TabsList className="bg-secondary/30 border border-border/50 w-fit rounded-2xl p-1.5 shrink-0 mb-4">
              <TabsTrigger
                value="dashboard"
                className="rounded-xl data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm px-4 py-1.5 text-muted-foreground font-medium"
              >
                Dashboard
              </TabsTrigger>
              <TabsTrigger
                value="settings"
                className="rounded-xl data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm px-4 py-1.5 text-muted-foreground font-medium"
              >
                Ustawienia Generalne
              </TabsTrigger>
              <TabsTrigger
                value="templates"
                className="rounded-xl data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm px-4 py-1.5 text-muted-foreground font-medium"
              >
                Szablony Raportów
              </TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard" className="flex-1 min-h-0 mt-4">
              <ReportsDashboardTab />
            </TabsContent>

            <TabsContent value="settings" className="flex-1 min-h-0 mt-4">
              <SettingsTab />
            </TabsContent>

            <TabsContent value="templates" className="flex-1 min-h-0 mt-4">
              <TemplatesTab />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Рендерим модалку */}
      <GenerateCycleModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  )
}
